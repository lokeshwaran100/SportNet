use starknet::ContractAddress;
// How to check if the athlete has won the game or lost? Oracles?

// Flow of the contract..
// 1. Users/sponsors bet on the matches of the athletes registered with the platform
// 2. Users/sponsors need to register with the platform to participate in the betting.
// 3. Users bet with a specific amount on the preferred option.
// 4. We wait for the market to fully mature
// 5. Once we understand how the market has resolved, the winners get their deposit back and 70% of the losers funds.
// 6. 30% of the funds are given to the athlete

#[starknet::interface]
trait ISportNetBetting<TContractState> {
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

    // fn getMarketCount(self: @TContractState) -> u256;

    fn buyShares(ref self: TContractState, marketId: u128, amount: u128);

    fn settleMarket(ref self: TContractState, marketId: u256, winningOutcome: u8);

    fn toggleMarketStatus(ref self: TContractState, marketId: u256);

    fn claimWinnings(ref self: TContractState, marketId: u256, receiver: ContractAddress);

    // fn getMarket(self: @TContractState, marketId: u256) -> Market;

    // fn getAllMarkets(self: @TContractState) -> Array<Market>;

    // fn getMarketByCategory(self: @TContractState, category: felt252) -> Array<Market>;

    // fn getContractOwner(self: @TContractState) -> ContractAddress;

    // fn getUserMarkets(self: @TContractState, user: ContractAddress) -> Array<Market>;

}

#[starknet::contract]
mod SportNetBetting {
    use core::traits::Into;
use core::num::traits::zero::Zero;
use core::starknet::event::EventEmitter;
use starknet::{ContractAddress, get_caller_address, storage_access::StorageBaseAddress};

    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        // athlethe and verified pair
        athletes: LegacyMap::<ContractAddress, bool>,

        // market count
        market_count: u128,

        // market ID and market details pair
        markets: LegacyMap::<u128, Market>,

        // better count
        better_count: u128,

        // user ID and athlethe pair
        better_athlete: LegacyMap::<u128, ContractAddress>,

        // user ID and donor pair
        betters: LegacyMap::<u128, ContractAddress>,

        // user ID and sponsored amount pair
        bet_amount: LegacyMap::<u128, u128>,

        // market ID and athlethe pair
        athlete_markets: LegacyMap::<u128, ContractAddress>,

        // market ID and collected amount pair
        market_amount: LegacyMap::<u128, u128>,
    }

    #[derive(Drop, clone, starknet::Store)]
    pub struct Market {
        name: ByteArray,
        description: ByteArray,
        pub athlete: ContractAddress,
        pub outcomes: (Options, Options),
        category: felt252,
        isSettled: bool,
        isActive: bool,
        isVerified: bool,
        deadline: felt252,
        betToken: ContractAddress,
        winningOutcome: Option<Options>,
        pub minBet: u256,
        pub moneyInPool: u256,
    }

    #[derive(Drop, starknet::Store)]
    pub struct Options {
        name: felt252,
        sharesBought: u256
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreatedMarket: CreatedMarket,
        BetPlaced: BetPlaced,
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

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.market_count.write(0);
        self.better_count.write(0);
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
            let mut token1 = Options { name: scenario1, sharesBought: 0_u256};
            let mut token2 = Options { name: scenario2, sharesBought: 0_u256};

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

        fn buyShares(ref self: ContractState, marketId: u128, amount: u128) {
            let better: ContractAddress = get_caller_address();
            if better.is_zero() {
                panic!("Better is zero address");
            }

            let market = self.markets.read(marketId);
            if !market.isVerified {
                panic!("Market does not exist");
            }

            if market.isSettled {
                panic!("Market has already been resolved");
            }

            let betterId = self.better_count.read() + 1;
            self.better_count.write(betterId);
            self.betters.write(betterId, better);
            self.better_athlete.write(betterId, market.athlete);
            self.market_amount.write(marketId, self.market_amount.read(marketId) + amount);
            self.bet_amount.write(betterId, self.bet_amount.read(betterId) + amount);
            self.emit(BetPlaced {user_id: betterId, user: better, market_id: marketId, athlete: market.athlete, amount});
        }

        fn settleMarket(ref self: ContractState, marketId: u256, winningOutcome: u8) {}

        fn toggleMarketStatus(ref self: ContractState, marketId: u256) {}

        fn claimWinnings(ref self: ContractState, marketId: u256, receiver: ContractAddress) {}

    }
}
