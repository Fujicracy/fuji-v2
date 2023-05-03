export type BannerConfig = {
  key: string;
  message: string;
  link?: { label: string; url: string };
};

export const BANNERS: BannerConfig[] = [
  {
    key: 'betaTest',
    message:
      'We are in beta, some bugs may arise. We appreciate your feedback as we work diligently to improve the dApp user experience.',
  },
];
