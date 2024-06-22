use starknet::ContractAddress;

#[starknet::interface]
pub trait ISportNetBetting<TContractState> {
    fn createMarket(
        ref self: TContractState,
        name: ByteArray,
        description: ByteArray,
        athlete: ContractAddress,
        options: (felt252, felt252),
        minBet: u256,
    );
    fn betOnMarket(ref self: TContractState, marketId: u128, outcome: u8, amount: u256);
    fn resolveMarket(ref self: TContractState, marketId: u128, winningOption: u8);
    fn claimWinnings(ref self: TContractState, marketId: u128, receiver: ContractAddress);
    fn getWinnerShares(ref self: TContractState, marketId: u128) -> (u256, u256);
    fn checkMarketStatus(ref self: TContractState, marketId: u128, user: ContractAddress);
    fn getMarketCount(ref self: TContractState) -> u128;
    fn getMarket(ref self: TContractState, marketId: u128) -> SportNetBetting::Market;
    fn getContractOwner(ref self: TContractState) -> ContractAddress;
    fn getAllMarkets(ref self: TContractState) -> Array<SportNetBetting::Market>;
}

#[starknet::contract]
pub mod SportNetBetting {
    use funding::SportNetFunding::ISportNetCrowdFundingDispatcherTrait;
    use funding::SportNetBetting::ISportNetBetting;
    use funding::SportNetFunding::ISportNetCrowdFundingDispatcher;
    use core::clone::Clone;
    use core::traits::AddEq;
    use core::option::OptionTrait;
    use core::array::ArrayTrait;
    use core::traits::Into;
    use core::num::traits::zero::Zero;
    use core::starknet::event::EventEmitter;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, SyscallResultTrait, storage_access::StorageBaseAddress};
    use starknet::syscalls::{call_contract_syscall};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        // ERC20 token address
        token_address: ContractAddress,

        // funding contract address
        crowfundingContract: ContractAddress,

        // market count
        market_count: u128,

        // market ID and market details pair
        markets: LegacyMap::<u128, Market>,

        // market participants
        market_participants: LegacyMap::<(u128, ContractAddress), Participants>,

        // market winners
        market_winners: LegacyMap::<(u128, ContractAddress), Winners>,

        // participant and bool pair
        participant_exists: LegacyMap::<(u128, ContractAddress), bool>,

        // winner and bool pair
        winner_exists: LegacyMap::<(u128, ContractAddress), bool>,

        // beter count
        beter_count: u128,

        // user ID and user address pair
        beters: LegacyMap::<u128, ContractAddress>,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
    pub struct Market {
        name: ByteArray,
        description: ByteArray,
        pub athlete: ContractAddress,
        pub outcomes: (Scenarios, Scenarios),
        isSettled: bool,
        isActive: bool,
        isVerified: bool,
        winningOutcome: Option<Scenarios>,
        pub minBet: u256,
        pub moneyInPool: u256,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
    pub struct Participants {
        pub user: ContractAddress,
        pub chosenOutcome: Scenarios,
        betAmount: u256,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
    pub struct Winners {
        pub user: ContractAddress,
        pub wins: u256,
        pub claimed: bool,
    }

    #[derive(Drop, Serde, Copy, starknet::Store, PartialEq, Eq)]
    pub struct Scenarios {
        name: felt252,
        opted: u128,
        amount: u256,
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
            minBet: u256,
        ) {
            let user: ContractAddress = get_caller_address();
            assert!(user == self.owner.read(), "Only owner can create a market");
            let (scenario1, scenario2) = options;
            let mut token1 = Scenarios { name: scenario1, opted: 0_u128, amount: 0_u256};
            let mut token2 = Scenarios { name: scenario2, opted: 0_u128, amount: 0_u256};

            let tokens = (token1, token2);

            // Check if the creator is a registered athlete
            assert!(ISportNetCrowdFundingDispatcher{contract_address: self.crowfundingContract.read()}.is_athlethe_register(athlete), "Athlete is not registered yet!");

            let market = Market {
                name,
                description,
                athlete,
                outcomes: tokens,
                isSettled: false,
                isActive: true,
                isVerified: true,
                winningOutcome: Option::None,
                minBet,
                moneyInPool: 0,
            };

            let market_id = self.market_count.read() + 1;

            self.market_count.write(market_id);
            self.markets.write(market_id, market);
            let createdMarket = self.markets.read(market_id);
            self.emit(CreatedMarket {market_id, market: createdMarket, athlete, amount: 0_u256});
        }

        fn betOnMarket(ref self: ContractState, marketId: u128, outcome: u8, amount: u256) {
            let beter: ContractAddress = get_caller_address();
            let mut market = self.markets.read(marketId);
            assert!(market.clone().isVerified, "Market does not exist");
            assert!(market.clone().isActive, "Market has already been resolved");
            assert!(amount >= market.clone().minBet, "Market accept a larger minimum bet amount");

            let beterId = self.beter_count.read() + 1;
            self.beter_count.write(beterId);
            self.beters.write(beterId, beter);
            let (mut opt1, mut opt2) = market.clone().outcomes;

            let token_address: ContractAddress = self.token_address.read();
            let contract_address = get_contract_address();
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, amount);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(beter,contract_address, amount);

            assert!(result, "Transfer Failed!");
            if outcome == 0 {
                let user_part = Participants {
                    user: beter,
                    chosenOutcome: opt1,
                    betAmount: amount,
                };
                opt1.opted = opt1.opted + 1;
                opt1.amount = opt1.amount + amount;
                self.market_participants.write((marketId, beter), user_part.clone());
                self.participant_exists.write((marketId, beter), true);
            } else {
                let user_part = Participants {
                    user: beter,
                    chosenOutcome: opt2,
                    betAmount: amount,
                };
                opt2.opted = opt2.opted + 1;
                opt2.amount = opt2.amount + amount;
                self.market_participants.write((marketId, beter), user_part.clone());
                self.participant_exists.write((marketId, beter), true);
            }
            market.moneyInPool = market.clone().moneyInPool + amount;
            self.markets.write(marketId, market.clone());
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

        fn claimWinnings(ref self: ContractState, marketId: u128, receiver: ContractAddress) {
            assert!(!receiver.is_zero(), "Receiver cannot be address zero");
            let user = get_caller_address();
            self.checkMarketStatus(marketId, user);
            assert!(self.winner_exists.read((marketId, user)), "User is not one of the winners in the market");
            let user_wins = self.market_winners.read((marketId, user));
            assert!(!user_wins.claimed, "User has already claimed their winning funds");
            let token_address: ContractAddress = self.token_address.read();
            let contract_address = get_contract_address();
            let winner = Winners {
                user,
                wins: user_wins.wins,
                claimed: true,
            };
            self.market_winners.write((marketId, user), winner);
            self.winner_exists.write((marketId, user), true);
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, user_wins.wins);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(contract_address, receiver, user_wins.wins);
            assert!(result, "Transfer Failed!");
        }

        fn getWinnerShares(ref self: ContractState, marketId: u128) -> (u256, u256) {
            let market = self.markets.read(marketId);
            let winningOption = market.clone().winningOutcome.unwrap();
            let (opt1, opt2) = market.clone().outcomes;
            let mut athlete_share: u256 = 0;
            let mut winner_shares: u256 = 0;
            if opt1 == winningOption {
                let profit_pot = opt2.amount;
                winner_shares = (profit_pot * (80/100))/(opt1.opted.into());
                athlete_share = (profit_pot - (winner_shares * opt1.opted.into()));
            } else {
                let profit_pot = opt1.amount;
                winner_shares = (profit_pot * (80/100))/(opt2.opted.into());
                athlete_share = (profit_pot - (winner_shares * opt2.opted.into()));
            }
            return (athlete_share, winner_shares);
        }

        fn checkMarketStatus(ref self: ContractState, marketId: u128, user: ContractAddress) {
            let market = self.markets.read(marketId);
            assert!(market.isSettled, "Market has not been resolved yet!");
            assert!(self.participant_exists.read((marketId, user)), "User is not part of the market");

            let market_user = self.market_participants.read((marketId,user));
            let market_athlete = market.clone().athlete;
            let (athlete_share, winner_shares) = self.getWinnerShares(marketId);
            if market_user.chosenOutcome == market.winningOutcome.unwrap() {
                let winner = Winners {
                    user,
                    wins: market_user.betAmount + winner_shares,
                    claimed: false,
                };
                self.market_winners.write((marketId,user), winner);
                self.winner_exists.write((marketId, user), true);
            }
            let athlete_win = Winners {
                user: market_athlete,
                wins: athlete_share,
                claimed: false,
            };
            self.market_winners.write((marketId, market_athlete), athlete_win);
            self.winner_exists.write((marketId, market_athlete), true);
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

        fn getContractOwner(ref self: ContractState) -> ContractAddress {
            return self.owner.read();
        }
    }
}

// #[cfg(test)]
// mod tests {
//     use super::{ SportNetBetting, ISportNetBettingDispatcher, ISportNetBettingDispatcherTrait };
//     use starknet::{ ContractAddress, syscalls::deploy_syscall };

//     fn deploy_contract() -> ISportNetBettingDispatcher {
//         let mut calldata = ArrayTrait::new();
//         let (address0, _) = deploy_syscall(
//             SportNetBetting::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false
//         )
//             .unwrap();
//         let contract0 = ISportNetBettingDispatcher { contract_address: address0 };
//         contract0
//     }

//     #[test]
//     #[available_gas(1000000)]
//     fn test_get() {
//         let contract = deploy_contract();
//         let data = contract.get();

//         assert_eq!(0, data);
//     }

//     #[test]
//     #[available_gas(1000000)]
//     fn test_set() {
//         let contract = deploy_contract();
//         contract.set(10);
//         let data = contract.get();

//         assert_eq!(10, data);
//     }
// }
