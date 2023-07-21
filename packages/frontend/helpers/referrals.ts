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

export const widgetConfig = {
  ...config,
  apiKey: process.env.NEXT_PUBLIC_REFERRAL_API_KEY,
};

const campaign = {
  id: campaignId,
};

const client = new ChainvineClient(config);

export const storeReferrer = () => storeReferrerId();

export const syncAddressWithCampaign = async (address?: string) => {
  if (!address) return;
  // First sync the user with the new address, don't do a thing in case of a disconnect
  const userClient = await client.syncUser(address);
  const referrerId = getReferrerId();
  // If there is a referrerId...
  if (referrerId) {
    // ...link the user to the referrerId
    await userClient
      .referral({
        campaign,
      })
      .linkToReferrer(referrerId);
    // ...and record the click
    await client.recordClick(referrerId, campaignId);
  }
};
