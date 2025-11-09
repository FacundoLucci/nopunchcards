import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
import resend from "@convex-dev/resend/convex.config";
import geospatial from "@convex-dev/geospatial/convex.config";
import autumn from "@useautumn/convex/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(resend);
app.use(geospatial);
app.use(autumn);

export default app;
