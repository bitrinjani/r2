import nock from "nock";

import SlackIntegration from "../../src/transport/SlackIntegration";
import * as util from "../../src/util";

const slackUrl = "https://hooks.slack.com/services";
const slackApi = nock(slackUrl);
slackApi.post("/xxxxxx").reply(200, "ok");
slackApi.post("/xxxxxx").replyWithError("mock error");

describe("SlackIntegration", function(){
  it("slack", () => {
    const config = {
      enabled: true,
      url: "https://hooks.slack.com/services/xxxxxx",
      channel: "#ch1",
      username: "abc",
      keywords: ["error", "profit"],
    } as object;
    const slack = new SlackIntegration(config);
    slack.handler("test message");
    slack.handler("with keyword: profit");
  });

  it("slack exception handling", async () => {
    const config = {
      enabled: true,
      url: "https://hooks.slack.com/services/xxxxxx",
      channel: "#ch1",
      username: "abc",
      keywords: ["error", "profit"],
    } as object;
    const slack = new SlackIntegration(config);
    slack.handler("test message");
    slack.handler("with keyword: profit");
    await util.delay(0);
  });

  it("slack with no keyword", () => {
    const config = {
      enabled: true,
      url: "https://hooks.slack.com/services/xxxxxx",
      channel: "#ch1",
      username: "abc",
    } as object;
    const slack = new SlackIntegration(config);
    slack.handler("test message");
    slack.handler("with keyword: profit");
  });

  this.afterAll(() => {
    nock.restore();
  });
});
