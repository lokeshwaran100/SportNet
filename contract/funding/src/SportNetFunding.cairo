use starknet::ContractAddress;

#[starknet::interface]
pub trait ISportNetCrowdFunding<TContractState> {
    fn athlethe_register(ref self: TContractState);
    fn create_campaign(ref self: TContractState, amount: u256);
    fn sponsor(ref self: TContractState, campaign_id: u128, amount: u256);
    fn claim(ref self: TContractState, campaign_id: u128);
    fn is_athlethe_register(self: @TContractState, athlethe: ContractAddress) -> bool;
    fn sponsor_share(self: @TContractState, athlethe: ContractAddress, sponsor: ContractAddress) -> u128;
}

#[starknet::contract]
mod SportNetCrowdFunding {
    use starknet::{get_caller_address, get_contract_address, ContractAddress, SyscallResultTrait};
    use starknet::syscalls::{call_contract_syscall};
    use core::serde::Serde;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    
    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        token_address: ContractAddress,

        // athlethe and verified pair
        athletes: LegacyMap::<ContractAddress, bool>,

        // athlethe and verified pair
        athlete_funded: LegacyMap::<ContractAddress, u256>,

        // (athelthe,sponsor) tuple and athlethe pair
        athlete_sponsors: LegacyMap::<(ContractAddress, ContractAddress), u256>,

        // campaign ID and amount pair
        campaigns: LegacyMap::<u128, u256>,

        // campaign ID and athlethe pair
        athlete_campaigns: LegacyMap::<u128, ContractAddress>,

        // campaign ID and collected amount pair
        campaign_amount: LegacyMap::<u128, u256>,

        // campaign count
        campaign_count: u128,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Registered: Registered,
        CreatedCampaign: CreatedCampaign,
        Sponspored: Sponspored,
        Claimed: Claimed,
    }
    #[derive(Drop, starknet::Event)]
    struct Registered {
        #[key]
        athlethe: ContractAddress,
    }
    #[derive(Drop, starknet::Event)]
    struct CreatedCampaign {
        #[key]
        campaign_id: u128,
        athlethe: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct Sponspored {
        #[key]
        sponsor: ContractAddress,
        campaign_id: u128,
        athlethe: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct Claimed {
        #[key]
        campaign_id: u128,
        athlethe: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, token_address: ContractAddress) {
        self.owner.write(owner);
        self.campaign_count.write(0);
        self.token_address.write(token_address);
    }

    #[abi(embed_v0)]
    impl SportNetCrowdFunding of super::ISportNetCrowdFunding<ContractState> {
        fn athlethe_register(ref self: ContractState) {
            let athlethe: ContractAddress = get_caller_address();
            assert!(!self.athletes.read(athlethe), "Athlethe already registered!");
            self.athletes.write(athlethe, true);
            self.athlete_funded.write(athlethe, 0);

            self.emit(Registered {athlethe});
        }

        fn create_campaign(ref self: ContractState, amount: u256) {
            let athlethe: ContractAddress = get_caller_address();
            assert!(self.athletes.read(athlethe), "Athlethe is not registered!");
            assert!(amount > 0, "Campaign amount cannot be 0");

            let campaign_id = self.campaign_count.read();
            self.campaigns.write(campaign_id, amount);
            self.athlete_campaigns.write(campaign_id, athlethe);
            self.campaign_amount.write(campaign_id, 0);

            self.campaign_count.write(campaign_id + 1_u128);

            self.emit(CreatedCampaign {campaign_id, athlethe, amount});
        }

        fn sponsor(ref self: ContractState, campaign_id: u128, amount: u256) {
            let campaign_amount = self.campaigns.read(campaign_id);
            assert!(campaign_amount > 0, "Campaign does not exists");

            let collected_amount = self.campaign_amount.read(campaign_id);
            let updated_campaign_amount = collected_amount + amount;
            assert!(campaign_amount >= updated_campaign_amount,
                "Deposited amount exceeds campaign limit");

            let sponsor = get_caller_address();
            let athlethe = self.athlete_campaigns.read(campaign_id);

            let contract_address = get_contract_address();
            // let mut call_data: Array<felt252> = ArrayTrait::new();
            // Serde::serialize(@sponsor, ref call_data);
            // Serde::serialize(@contract_address, ref call_data);
            // Serde::serialize(@amount, ref call_data);

            // let mut res = call_contract_syscall(
            //     self.token_address.read(), selector!("transferFrom"), call_data.span()
            // ).unwrap_syscall();
            // let result = Serde::<bool>::deserialize(ref res).unwrap();
            let token_address: ContractAddress = self.token_address.read();
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, amount);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(sponsor, contract_address, amount);

            assert!(result, "Transfer Failed!");

            let contributed = self.athlete_sponsors.read((athlethe, sponsor));
            self.athlete_sponsors.write((athlethe, sponsor), contributed + amount);
            self.athlete_funded.write(athlethe, self.athlete_funded.read(athlethe) + amount);
            self.campaign_amount.write(campaign_id, updated_campaign_amount);
            self.athlete_campaigns.write(campaign_id, athlethe);

            self.emit(Sponspored {sponsor, campaign_id, athlethe, amount});
        }

        fn claim(ref self: ContractState, campaign_id: u128) {
            let amount = self.campaigns.read(campaign_id);
            let collected_amount = self.campaign_amount.read(campaign_id);
            assert!(amount <= collected_amount, "Campaign limit is not reached");

            let caller: ContractAddress = get_caller_address();
            let athlethe = self.athlete_campaigns.read(campaign_id);

            assert!(caller == athlethe,
                    "Only athelthe who raised the campaign can claim");

            let contract_address = get_contract_address();
            // let mut call_data: Array<felt252> = ArrayTrait::new();
            // Serde::serialize(@contract_address, ref call_data);
            // Serde::serialize(@athlethe, ref call_data);
            // Serde::serialize(@amount, ref call_data);

            // let mut res = call_contract_syscall(
            //     self.token_address.read(), selector!("transferFrom"), call_data.span()
            // ).unwrap_syscall();
            // let result = Serde::<bool>::deserialize(ref res).unwrap();
            let token_address: ContractAddress = self.token_address.read();
            IERC20Dispatcher{contract_address: token_address}.approve(athlethe, amount);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(contract_address, athlethe, amount);

            assert!(result, "Claim Failed!");

            self.emit(Claimed {campaign_id, athlethe, amount});
        }

        fn is_athlethe_register(self: @ContractState, athlethe: ContractAddress) -> bool {
            self.athletes.read(athlethe)
        }

        fn sponsor_share(self: @ContractState, athlethe: ContractAddress, sponsor: ContractAddress) -> u128 {
            if !self.is_athlethe_register(athlethe) {
                return 0_u128;
            }

            let sponsor_fund = self.athlete_sponsors.read((athlethe, sponsor));

            if sponsor_fund == 0 {
                return 0_u128;
            }

            let total_funded = self.athlete_funded.read(athlethe);

            (sponsor_fund/total_funded).try_into().unwrap()
        }
    }
}


// #[cfg(test)]
// mod tests {
//     use super::{ SportNetCrowdFunding, ISportNetCrowdFundingDispatcher, ISportNetCrowdFundingDispatcherTrait };
//     use starknet::{ ContractAddress, syscalls::deploy_syscall };

//     fn deploy_contract() -> ISportNetCrowdFundingDispatcher {
//         let mut calldata = ArrayTrait::new();
//         let (address0, _) = deploy_syscall(
//             SportNetCrowdFunding::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false
//         )
//             .unwrap();
//         let contract0 = ISportNetCrowdFundingDispatcher { contract_address: address0 };
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

