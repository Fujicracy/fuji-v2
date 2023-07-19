import {
  ChainvineClient,
  getReferrerId,
  storeReferrerId,
} from '@chainvine/sdk';

const config = {
  logToConsole: true,
  testMode: true,
};

export const campaignId = process.env.NEXT_PUBLIC_REFERRAL_CAMPAIGN_ID ?? '';

const campaign = {
  id: campaignId,
};

const client = new ChainvineClient(config);

export const storeReferrer = () => storeReferrerId();

export const syncAddressWithCampaign = async (addr?: string) => {
  const address = addr ?? '';
  const userClient = await client.syncUser(address);
  const referrerId = getReferrerId();
  if (addr && referrerId) {
    await userClient
      .referral({
        campaign,
      })
      .linkToReferrer(referrerId);
  }
};
