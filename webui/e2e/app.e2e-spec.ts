import { AppPage } from "./app.po";

describe("poc App", () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it("should display welcome message", () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    page.navigateTo();
    expect(page.getParagraphText()).toEqual("Welcome to app!");
  });
});
