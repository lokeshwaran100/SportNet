use starknet::ContractAddress;

#[starknet::interface]
trait ISportNetCrowdFunding<TContractState> {
    fn athlethe_register(ref self: TContractState);
    fn create_campaign(ref self: TContractState, amount: u128);
    fn sponsor(ref self: TContractState, campaign_id: u128, amount: u128);
    fn claim(ref self: TContractState, campaign_id: u128);
    // fn athlethe_register(self: @TContractState) -> u128;
}

#[starknet::contract]
mod SportNetCrowdFunding {
    use starknet::{ContractAddress, get_caller_address, storage_access::StorageBaseAddress};

    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        // athlethe and verified pair
        athletes: LegacyMap::<ContractAddress, bool>,

        // sponsor ID and athlethe pair
        athlete_sponsors: LegacyMap::<u128, ContractAddress>,

        // sponsor ID and sponsor pair
        sponsors: LegacyMap::<u128, ContractAddress>,

        // sponsor ID and sponsored amount pair
        sponsored_amount: LegacyMap::<u128, u128>,

        // sponsor count
        sponsor_count: u128,

        // campaign ID and amount pair
        campaigns: LegacyMap::<u128, u128>,

        // campaign ID and athlethe pair
        athlete_campaigns: LegacyMap::<u128, ContractAddress>,

        // campaign ID and collected amount pair
        campaign_amount: LegacyMap::<u128, u128>,

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
        amount: u128,
    }
    #[derive(Drop, starknet::Event)]
    struct Sponspored {
        #[key]
        sponsor_id: u128,
        sponsor: ContractAddress,
        campaign_id: u128,
        athlethe: ContractAddress,
        amount: u128,
    }
    #[derive(Drop, starknet::Event)]
    struct Claimed {
        #[key]
        campaign_id: u128,
        athlethe: ContractAddress,
        amount: u128,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.sponsor_count.write(0);
        self.campaign_count.write(0);
    }

    #[abi(embed_v0)]
    impl SportNetCrowdFunding of super::ISportNetCrowdFunding<ContractState> {
        fn athlethe_register(ref self: ContractState) {
            let athlethe: ContractAddress = get_caller_address();
            if self.athletes.read(athlethe) {
                panic!("Athlethe already registered!");
            }
            self.athletes.write(athlethe, true);

            self.emit(Registered {athlethe});
        }

        fn create_campaign(ref self: ContractState, amount: u128) {
            let athlethe: ContractAddress = get_caller_address();
            if self.athletes.read(athlethe) {
                panic!("Athlethe is not registered!");
            }

            let campaign_id = self.campaign_count.read();
            self.campaigns.write(campaign_id, amount);
            self.athlete_campaigns.write(campaign_id, athlethe);
            self.campaign_amount.write(campaign_id, amount);

            self.campaign_count.write(campaign_id + 1_u128);

            self.emit(CreatedCampaign {campaign_id, athlethe, amount});
        }

        fn sponsor(ref self: ContractState, campaign_id: u128, amount: u128) {
            let campaign_amount = self.campaigns.read(campaign_id);
            if campaign_amount == 0 {
                panic!("Campaign does not exists");
            }

            let collected_amount = self.campaign_amount.read(campaign_id);
            let updated_campaign_amount = collected_amount + amount;
            if campaign_amount < updated_campaign_amount {
                panic!("Deposited amount exceeds campaign limit");
            }

            let sponsor: ContractAddress = get_caller_address();
            let athlethe = self.athlete_campaigns.read(campaign_id);

            let sponsor_id = self.sponsor_count.read();
            self.athlete_sponsors.write(sponsor_id, athlethe);
            self.sponsors.write(sponsor_id, sponsor);
            self.sponsored_amount.write(sponsor_id, amount);
            self.campaign_amount.write(campaign_id, updated_campaign_amount);
            self.athlete_campaigns.write(campaign_id, athlethe);

            // TODO: Actual fund transfer from sponsor wallet to this contract

            self.emit(Sponspored {sponsor_id, sponsor, campaign_id, athlethe, amount});
        }

        fn claim(ref self: ContractState, campaign_id: u128) {
            let amount = self.campaigns.read(campaign_id);
            let collected_amount = self.campaign_amount.read(campaign_id);

            if amount > collected_amount {
                panic!("Campaign limit is not reached");
            }

            let caller: ContractAddress = get_caller_address();
            let athlethe = self.athlete_campaigns.read(campaign_id);

            if caller != athlethe {
                panic!("Only athelthe who raised the campaign can claim");
            }

            // TODO: Actual fund transfer to athelthe

            self.emit(Claimed {campaign_id, athlethe, amount});
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

