// Load OpenTelemetry before anything else
require("./tracing.js");

const express = require("express");
const { createContextKey, context, trace } = require("@opentelemetry/api");

const MAIN_SPAN_CONTEXT_KEY = createContextKey("main_span_context_key");

function mainSpanMiddleware(req, res, next) {
  // pull the active span created by the http instrumentation
  let span = trace.getActiveSpan();

  // get the current context
  let ctx = context.active();

  // set any attributes we always want on the main span
  span.setAttribute("main", true);

  // save a reference to the span in the trace context
  context.with(ctx.setValue(MAIN_SPAN_CONTEXT_KEY, span), () => {
    next();
  });
}

// create another function that allows you to annotate this saved span easily
function setMainSpanAttributes(attributes) {
  let mainSpan = context.active().getValue(MAIN_SPAN_CONTEXT_KEY);
  if (mainSpan) {
    mainSpan.setAttributes(attributes);
  }
}

const app = express();
const port = 3000;

app.use(mainSpanMiddleware);

app.get("/", (req, res) => {
  setMainSpanAttributes({
    "user.id": "123",
    "user.type": "enterprise",
    "user.auth_method": "oauth",
  });

  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
