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
    fn betOnMarket(ref self: TContractState, marketId: u128, outcome: u8, amount: u256);
    fn resolveMarket(ref self: TContractState, marketId: u128, winningOption: u8);
    fn claimFunds(ref self: TContractState, marketId: u128, receiver: ContractAddress);
    fn calcWinningFunds(ref self: TContractState, marketId: u128);
    fn getWinners(ref self: TContractState, marketId: u128) -> (u256, Array<(ContractAddress, u256)>);
    fn getUserPositionByMarket(ref self: TContractState, marketId: u128, user: ContractAddress) -> Array<(SportNetBetting::Market, SportNetBetting::Scenarios, u256)>;
    fn getMarketCount(ref self: TContractState) -> u128;
    fn getMarket(ref self: TContractState, marketId: u128) -> SportNetBetting::Market;
    fn getContractOwner(ref self: TContractState) -> ContractAddress;
    fn getAllMarkets(ref self: TContractState) -> Array<SportNetBetting::Market>;
    fn getMarketByCategory(ref self: TContractState, category: felt252) -> Array<SportNetBetting::Market>;
    fn getUserMarkets(ref self: TContractState, user: ContractAddress) -> Array<(SportNetBetting::Market,SportNetBetting::Scenarios, u256)>;
}

#[starknet::contract]
pub mod SportNetBetting {
    use funding::SportNetBetting::ISportNetBetting;
    use core::clone::Clone;
    use core::traits::AddEq;
    use core::option::OptionTrait;
    use core::array::ArrayTrait;
    use core::traits::Into;
    use core::num::traits::zero::Zero;
    use core::starknet::event::EventEmitter;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, storage_access::StorageBaseAddress};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        // ERC20 token address
        token_address: ContractAddress,

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

        // user address and user markets position pair
        beter_markets: LegacyMap::<ContractAddress, Array<(Market, Scenarios, u256)>>,

        // market ID and all participants
        market_participants: LegacyMap::<u128, Array<ContractAddress>>,

        // marketID and winners + share pair + shares claimed or not
        market_winners: LegacyMap::<u128, Array<(ContractAddress, u256, bool)>>,

        // user ID and bet amount pair
        bet_amount: LegacyMap::<ContractAddress, u256>,

        // market ID and athlethe pair
        athlete_markets: LegacyMap::<u128, ContractAddress>,

        // market ID and collected amount pair
        market_amount: LegacyMap::<u128, u256>,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
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

    #[derive(Drop, Serde, Copy, starknet::Store, PartialEq, Eq)]
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
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct BetPlaced {
        #[key]
        user_id: u128,
        user: ContractAddress,
        market_id: u128,
        athlete: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct MarketResolved {
        #[key]
        market_id: u128,
        winningOutcome: Option<Scenarios>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, crowdfunding: ContractAddress, token: ContractAddress) {
        self.owner.write(owner);
        self.market_count.write(0);
        self.beter_count.write(0);
        self.crowfundingContract.write(crowdfunding);
        self.token_address.write(token);
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
            self.emit(CreatedMarket {market_id, market: createdMarket, athlete, amount: 0_u256});
        }

        fn betOnMarket(ref self: ContractState, marketId: u128, outcome: u8, amount: u256) {
            let beter: ContractAddress = get_caller_address();
            if beter.is_zero() {
                panic!("beter is zero address");
            }

            let mut market = self.markets.read(marketId);
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
            let mut participants = self.market_participants.read(marketId);
            participants.append(beter);
            self.market_participants.write(marketId, participants);
            let mut bet_markets = self.beter_markets.read(beter);
            let (opt1, opt2) = market.clone().outcomes;

            let token_address: ContractAddress = self.token_address.read();
            let contract_address = get_contract_address();
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, amount);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(beter,contract_address, amount);

            assert!(result, "Transfer Failed!");

            if outcome == 0 {
                bet_markets.append((market.clone(), opt1, amount));
            } else {
                bet_markets.append((market.clone(), opt2, amount));
            }
            market.moneyInPool = market.clone().moneyInPool + amount;
            self.markets.write(marketId, market.clone());
            self.beter_markets.write(beter, bet_markets);
            self.market_amount.write(marketId, self.market_amount.read(marketId) + amount);
            self.bet_amount.write(beter, self.bet_amount.read(beter) + amount);
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

        // distribute to all the winning participants
        fn claimFunds(ref self: ContractState, marketId: u128, receiver: ContractAddress) {
            assert!(!receiver.is_zero(), "Receiver cannot be address zero");
            let user = get_caller_address();
            self.calcWinningFunds(marketId);
            
            let token_address: ContractAddress = self.token_address.read();
            let contract_address = get_contract_address();
            let market_amount = self.market_amount.read(marketId);
            let mut winner_shares = self.market_winners.read(marketId);
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, market_amount);

            let mut index: u32 = 0;
            loop {
                if index == winner_shares.len() {
                    break;
                }
                let (winner, amount, claimed) = winner_shares.at(index);
                assert!(claimed.clone() == false, "Shares already claimed by this winner");
                assert!(user == winner.clone(), "User is not a winner for this market");
                let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(contract_address, receiver, amount.clone());
                assert!(result, "Transfer Failed!");
                index.add_eq(1);
            };
        }

        fn calcWinningFunds(ref self: ContractState, marketId: u128) {
            assert!(marketId <= self.market_count.read(), "Market does not exist");
            let (profit_pot, winners) = self.getWinners(marketId);
            let winner_share = (profit_pot * (80/100))/(winners.len().into());
            let athlete_share = (profit_pot - (winner_share * winners.len().into()));
            let market = self.markets.read(marketId);
            let athlete = market.athlete;
            let mut index: u32 = 0;
            let mut winner_array: Array<(ContractAddress, u256, bool)> = ArrayTrait::new();
            loop {
                if index == winners.len() {
                    break;
                }
                let (user, bet_value) = winners.at(index);
                winner_array.append((user.clone(), winner_share + bet_value.clone(), false));
                index.add_eq(1);
            };
            winner_array.append((athlete, athlete_share, false));
            self.market_winners.write(marketId, winner_array.clone());
        }

        fn getWinners(ref self: ContractState, marketId: u128) -> (u256, Array<(ContractAddress, u256)>) {
            let market = self.markets.read(marketId);
            assert!(market.clone().isSettled, "Market is not settled yet");
            let mut winners: Array<(ContractAddress, u256)> = ArrayTrait::new();
            let winningOption = market.clone().winningOutcome.unwrap();
            let participants = self.market_participants.read(marketId);
            let mut index: u32 = 0;
            let mut profit_amt: u256 = 0;
            loop {
                if index == participants.len() {
                    break;
                }
                let user = *participants.at(index);
                let bet_positions = self.getUserPositionByMarket(marketId, user);
                let mut j: u32 = 0;
                loop {
                    if j == bet_positions.len() {
                        break;
                    }
                    let (_bet_market, bet_outcome, bet_amount) = bet_positions.at(j);
                    if bet_outcome == @winningOption {
                        winners.append((user, bet_amount.clone()));
                    } else {
                        profit_amt = profit_amt + *bet_amount;
                    }
                    j.add_eq(1);
                };
                index.add_eq(1);
            };
            return (profit_amt, winners);
        }

        fn getUserPositionByMarket(ref self: ContractState, marketId: u128, user: ContractAddress) -> Array<(Market, Scenarios, u256)> {
            let market = self.markets.read(marketId);
            let mut return_array: Array<(Market, Scenarios, u256)> = ArrayTrait::new();
            let bet_outcomes = self.beter_markets.read(user);
            let mut index: u32 = 0;
            loop {
                if index == bet_outcomes.len() {
                    break;
                }
                let (bet_market, bet_outcome, bet_amount) = bet_outcomes.at(index);
                if bet_market == @market {
                    return_array.append((bet_market.clone(), bet_outcome.clone(), bet_amount.clone()));
                }
                index = index + 1;
            };
            return return_array;
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

        fn getUserMarkets(ref self: ContractState, user: ContractAddress) -> Array<(Market, Scenarios, u256)> {
            return self.beter_markets.read(user);
        }
    }
}
