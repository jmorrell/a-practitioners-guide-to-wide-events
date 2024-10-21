const opentelemetry = require("@opentelemetry/sdk-node");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  // use this to send to otel-desktop-viewer
  // https://github.com/CtrlSpice/otel-desktop-viewer
  // traceExporter: new OTLPTraceExporter(),
  instrumentations: [new HttpInstrumentation()],
});

sdk.start();
