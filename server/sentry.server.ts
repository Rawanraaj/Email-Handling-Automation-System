import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event) {
    // Remove sensitive data before sending to Sentry
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = "[Filtered]";
    }
    return event;
  },
});

export default Sentry;
