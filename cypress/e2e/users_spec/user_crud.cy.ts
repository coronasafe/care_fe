import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

const makeid = (length: number) => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const makePhoneNumber = () =>
  "9199" + Math.floor(Math.random() * 99999999).toString();

const username = makeid(20);
const phone_number = makePhoneNumber();
const alt_phone_number = makePhoneNumber();

describe("User management", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.intercept(/fontawesome/).as("fontawesome");
    cy.intercept(/currentuser/).as("currentuser");
    cy.visit("/user");
    cy.wait("@fontawesome");
    cy.wait("@currentuser");
  });

  it("create user", () => {
    cy.contains("Add New User").click();
    cy.get("[name='user_type']").select("Volunteer");
    cy.get("input[type='checkbox']").click();
    cy.wait(1000);
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.wait(1000);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number, {
      force: true,
    });
    cy.get("[name='facilities']")
      .type("Mysore", { delay: 200 })
      .wait(2000)
      .type("{downarrow}{enter}");
    cy.wait(2000);
    cy.get("[name='username']").type(username, { force: true });
    cy.get("[name='dob']").type("02/03/2001");
    cy.get("[name='password']").type("#@Cypress_test123");
    cy.get("[name='c_password']").type("#@Cypress_test123");
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[name='email']").type("cypress@tester.com");
    cy.get("[name='gender']").select("Male");
    cy.get("[name='state']").select("Kerala");
    cy.get("[name='district']").select("Ernakulam");
    cy.get("button[type='submit']").contains("Save User").click();
    cy.wait(2000);
    cy.verifyNotification("User added successfully");
  });

  it("view user and verify details", () => {
    cy.wait(1000);
    cy.contains("Advanced Filters").click();
    cy.wait(2000);
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number);
    cy.contains("Apply").click();
    cy.wait(2000);
    cy.get("[name='search']").type(username, { force: true });
    cy.wait(1000);
    // TODO: some verify task
  });

  it("update user", () => {
    cy.contains("Advanced Filters").click().wait(2000);
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number);
    cy.contains("Apply").click();
    cy.wait(2000);
    cy.intercept(/\/api\/v1\/users/).as("getUsers");
    cy.get("[name='search']").type(username, { force: true });
    cy.wait("@getUsers");
    cy.wait(1000);
    cy.get("a")
      .contains("Click here to show linked facilities")
      .click({ force: true })
      .then(() => {
        cy.get("a")
          .should("contain", "Link new facility")
          .contains("Link new facility")
          .click({ force: true });
      });
    cy.get("[name='facility']")
      .type("test")
      .wait(2000)
      .type("{downarrow}{enter}");
    cy.get("button > span").contains("Add").click({ force: true }).wait(1000);
  });

  it("deletes user", () => {
    cy.get("[name='search']").type(username);
    cy.wait(2000);
    cy.get("button").should("contain", "Delete").contains("Delete").click();
    cy.get("button.font-medium.btn.btn-danger").click();
  });

  it("Next/Previous Page", () => {
    cy.wait(1000);
    // only works for desktop mode
    cy.get("button")
      .should("contain", ">")
      .contains(">")
      .click({ force: true });
    cy.get("button")
      .should("contain", "<")
      .contains("<")
      .click({ force: true });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
