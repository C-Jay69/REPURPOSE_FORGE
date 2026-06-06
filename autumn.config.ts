import { feature, plan, item } from "atmn";

export const repurposes = feature({
  id: "repurposes",
  name: "Repurposes",
  type: "metered",
  consumable: true,
});

export const free = plan({
  id: "free",
  name: "Free",
  autoEnable: true,
  items: [
    item({
      featureId: repurposes.id,
      included: 5,
      reset: { interval: "month" },
    }),
  ],
});

export const pro = plan({
  id: "pro",
  name: "Pro",
  price: { amount: 1900, interval: "month" },
  items: [
    item({
      featureId: repurposes.id,
      included: 200,
      reset: { interval: "month" },
    }),
  ],
});

export const unlimited = plan({
  id: "unlimited",
  name: "Unlimited",
  price: { amount: 4900, interval: "month" },
  items: [
    item({
      featureId: repurposes.id,
      included: 999999,
      reset: { interval: "month" },
    }),
  ],
});

export default {
  features: [repurposes],
  plans: [free, pro, unlimited],
};
