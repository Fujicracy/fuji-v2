import {
  ChainvineClient,
  getReferrerId,
  storeReferrerId,
} from '@chainvine/sdk';

const config = {
  apiKey: process.env.NEXT_PUBLIC_REFERRAL_API_KEY,
  logToConsole: true,
  testMode: true,
};

export const REFERRAL_WIDGET_WIDTH = 55; // Percentage

export const campaignId = process.env.NEXT_PUBLIC_REFERRAL_CAMPAIGN_ID ?? '';

export const widgetConfig = {
  ...config,
};

const campaign = {
  id: campaignId,
};

const client = new ChainvineClient(config);

export const storeReferrer = () => storeReferrerId();

export const syncAddressWithCampaign = async (address: string) => {
  // First sync the user with the new address, don't do a thing in case of a disconnect
  const userClient = await client.syncUser(address);
  const referrerId = getReferrerId();
  // If there is a referrerId...
  console.log('referrerId', referrerId);
  if (referrerId) {
    try {
      // ...link the user to the referrerId
      const linkResult = await userClient
        .referral({
          campaign,
        })
        .linkToReferrer(referrerId);
      // ...and record the click
      const clickResult = await client.recordClick(referrerId, campaignId);
      console.log('linkResult', linkResult);
      console.log('clickResult', clickResult);
    } catch (error) {
      console.error(error);
    }
  }
};
