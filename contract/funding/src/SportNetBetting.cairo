use starknet::ContractAddress;
use funding::SportNetFunding;

#[starknet::interface]
pub trait ISportNetBetting<TContractState> {
    fn createMarket(
        ref self: TContractState,
        name: ByteArray,
        description: ByteArray,
        athlete: ContractAddress,
        options: (felt252, felt252),
        betToken: ContractAddress,
        category: felt252,
        minBet: u256,
        deadline: felt252,
    );
    fn betOnMarket(ref self: TContractState, marketId: u128, amount: u128);
    fn resolveMarket(ref self: TContractState, marketId: u128, winningOption: u8);
    fn claimFunds(ref self: TContractState, marketId: u128, receiver: ContractAddress);
    fn getMarketCount(ref self: TContractState) -> u128;
    fn getMarket(ref self: TContractState, marketId: u128) -> SportNetBetting::Market;
    fn getContractOwner(ref self: TContractState) -> ContractAddress;
    fn getAllMarkets(ref self: TContractState) -> Array<SportNetBetting::Market>;
    fn getMarketByCategory(ref self: TContractState, category: felt252) -> Array<SportNetBetting::Market>;
    fn getUserMarkets(ref self: TContractState, user: ContractAddress) -> Array<SportNetBetting::Market>;
}

#[starknet::contract]
pub mod SportNetBetting {
    use core::array::ArrayTrait;
    use core::traits::Into;
    use core::num::traits::zero::Zero;
    use core::starknet::event::EventEmitter;
    use starknet::{ContractAddress, get_caller_address, storage_access::StorageBaseAddress};

    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        // funding contract address
        crowfundingContract: ContractAddress,

        // athlethe and verified pair
        athletes: LegacyMap::<ContractAddress, bool>,

        // market count
        market_count: u128,

        // market ID and market details pair
        markets: LegacyMap::<u128, Market>,

        // beter count
        beter_count: u128,

        // user ID and athlethe pair
        beter_athlete: LegacyMap::<u128, ContractAddress>,

        // user ID and user address pair
        beters: LegacyMap::<u128, ContractAddress>,

        // user ID and user markets pair
        beter_markets: LegacyMap::<ContractAddress, Array<Market>>,

        // user ID and sponsored amount pair
        bet_amount: LegacyMap::<u128, u128>,

        // market ID and athlethe pair
        athlete_markets: LegacyMap::<u128, ContractAddress>,

        // market ID and collected amount pair
        market_amount: LegacyMap::<u128, u128>,
    }

    #[derive(Drop, Serde, Clone, starknet::Store)]
    pub struct Market {
        name: ByteArray,
        description: ByteArray,
        pub athlete: ContractAddress,
        pub outcomes: (Scenarios, Scenarios),
        category: felt252,
        isSettled: bool,
        isActive: bool,
        isVerified: bool,
        deadline: felt252,
        betToken: ContractAddress,
        winningOutcome: Option<Scenarios>,
        pub minBet: u256,
        pub moneyInPool: u256,
    }

    #[derive(Drop, Serde, Copy, starknet::Store)]
    pub struct Scenarios {
        name: felt252,
        sharesBought: u256
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreatedMarket: CreatedMarket,
        BetPlaced: BetPlaced,
        MarketResolved: MarketResolved,
    }
    #[derive(Drop, starknet::Event)]
    struct CreatedMarket {
        #[key]
        market_id: u128,
        market: Market,
        athlete: ContractAddress,
        amount: u128,
    }
    #[derive(Drop, starknet::Event)]
    struct BetPlaced {
        #[key]
        user_id: u128,
        user: ContractAddress,
        market_id: u128,
        athlete: ContractAddress,
        amount: u128,
    }
    #[derive(Drop, starknet::Event)]
    struct MarketResolved {
        #[key]
        market_id: u128,
        winningOutcome: Option<Scenarios>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, crowdfunding: ContractAddress) {
        self.owner.write(owner);
        self.market_count.write(0);
        self.beter_count.write(0);
        self.crowfundingContract.write(crowdfunding);
    }

    #[abi(embed_v0)]
    impl SportNetBetting of super::ISportNetBetting<ContractState> {

        fn createMarket(
            ref self: ContractState,
            name: ByteArray,
            description: ByteArray,
            athlete: ContractAddress,
            options: (felt252, felt252),
            betToken: ContractAddress,
            category: felt252,
            minBet: u256,
            deadline: felt252,
        ) {
            let (scenario1, scenario2) = options;
            let mut token1 = Scenarios { name: scenario1, sharesBought: 0_u256};
            let mut token2 = Scenarios { name: scenario2, sharesBought: 0_u256};

            let tokens = (token1, token2);

            // Check if the creator is a registered athlete
            let athlete: ContractAddress = get_caller_address();
            if !self.athletes.read(athlete) {
                panic!("Markets.cairo: Athlete needs to be registered!");
            }

            let market = Market {
                name,
                description,
                athlete,
                outcomes: tokens,
                category,
                isSettled: false,
                isActive: true,
                isVerified: true,
                deadline,
                betToken: betToken,
                winningOutcome: Option::None,
                minBet,
                moneyInPool: 0,
            };

            let market_id = self.market_count.read() + 1;

            self.market_count.write(market_id);
            self.athlete_markets.write(market_id, athlete);
            self.markets.write(market_id, market);
            let createdMarket = self.markets.read(market_id);
            self.emit(CreatedMarket {market_id, market: createdMarket, athlete, amount: 0_u128});
        }

        fn betOnMarket(ref self: ContractState, marketId: u128, amount: u128) {
            let beter: ContractAddress = get_caller_address();
            if beter.is_zero() {
                panic!("beter is zero address");
            }

            let market = self.markets.read(marketId);
            if !market.clone().isVerified {
                panic!("Market does not exist");
            }

            if market.clone().isSettled {
                panic!("Market has already been resolved");
            }

            let beterId = self.beter_count.read() + 1;
            self.beter_count.write(beterId);
            self.beters.write(beterId, beter);
            self.beter_athlete.write(beterId, market.clone().athlete);
            let mut bet_markets = self.beter_markets.read(beter);
            bet_markets.append(market.clone());
            self.beter_markets.write(beter, bet_markets);
            self.market_amount.write(marketId, self.market_amount.read(marketId) + amount);
            self.bet_amount.write(beterId, self.bet_amount.read(beterId) + amount);
            self.emit(BetPlaced {user_id: beterId, user: beter, market_id: marketId, athlete: market.athlete, amount});
        }

        fn resolveMarket(ref self: ContractState, marketId: u128, winningOption: u8) {
            assert!(get_caller_address() == self.owner.read(), "Only the owner can setlle markets");
            assert!(winningOption == 0_u8 || winningOption == 1_u8, "Invalid option provided");
            let mut currentMarket = self.markets.read(marketId);
            assert!(currentMarket.clone().isActive == true, " Only active markets can be resolved");
            currentMarket.isActive = false;
            currentMarket.isSettled = true;
            let (marketOption1, marketOption2) = currentMarket.clone().outcomes;
            if winningOption == 0 {
                currentMarket.winningOutcome = Option::Some(marketOption1);
            } else {
                currentMarket.winningOutcome = Option::Some(marketOption2);
            }
            self.markets.write(marketId, currentMarket.clone());
            self.emit(MarketResolved {market_id: marketId, winningOutcome: currentMarket.winningOutcome});
        }

        fn claimFunds(ref self: ContractState, marketId: u128, receiver: ContractAddress) {
            assert!(marketId <= self.market_count.read(), "Market does not exist");
            assert!(!receiver.is_zero(), "Receiver cannot be address zero");
            let market = self.markets.read(marketId);
            let beter = get_caller_address();
            let beter_markets = self.beter_markets.read(beter);
            let mut index: u128 = 0;
            // loop {
            //     if index == beter_markets.len() {
            //         break;
            //     }

            //     index = index + 1;
            // }
        }

        fn getMarketCount(ref self: ContractState) -> u128 {
            return self.market_count.read();
        }

        fn getMarket(ref self: ContractState, marketId: u128) -> Market {
            assert!(marketId <= self.market_count.read(), "Market does not exist");
            return self.markets.read(marketId);
        }

        fn getAllMarkets(ref self: ContractState) -> Array<Market> {
            let mut markets: Array<Market> = ArrayTrait::new();
            let mut index: u128 = 0;
            loop {
                if index == self.market_count.read() {
                    break;
                }
                let currMarket = self.markets.read(index);
                markets.append(currMarket);
                index = index + 1;
            };
            return markets;
        }

        fn getMarketByCategory(ref self: ContractState, category: felt252) -> Array<Market> {
            let mut markets: Array<Market> = ArrayTrait::new();
            let mut index: u128 = 0;
            loop {
                if index == self.market_count.read() {
                    break;
                }
                let currMarket = self.markets.read(index);
                if currMarket.category == category {
                    markets.append(currMarket);
                }
                index = index + 1;
            };
            return markets;
        }

        fn getContractOwner(ref self: ContractState) -> ContractAddress {
            return self.owner.read();
        }

        fn getUserMarkets(ref self: ContractState, user: ContractAddress) -> Array<Market> {
            return self.beter_markets.read(user);
        }
    }
}
