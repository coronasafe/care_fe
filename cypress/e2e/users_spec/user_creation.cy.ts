import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { AssetSearchPage } from "../../pageobject/Asset/AssetSearch";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import { UserPage } from "../../pageobject/Users/UserSearch";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";

describe("User Creation", () => {
  const userPage = new UserPage();
  const loginPage = new LoginPage();
  const userCreationPage = new UserCreationPage();
  const facilityPage = new FacilityPage();
  const assetSearchPage = new AssetSearchPage();
  const fillFacilityName = "Dummy Facility 1";
  const makeid = (length: number) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  const username = makeid(25);
  const alreadylinkedusersviews = [
    "devdoctor",
    "devstaff2",
    "devdistrictadmin",
  ];
  const EXPECTED_ERROR_MESSAGES = [
    "Please select the User Type",
    "Please enter valid phone number",
    "Please enter the username",
    "Please enter date in YYYY/MM/DD format",
    "Please enter the password",
    "Confirm password is required",
    "First Name is required",
    "Last Name is required",
    "Please enter a valid email address",
    "Please select the Gender",
    "Please select the state",
    "Please select the district",
    "Please select the local body",
  ];

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/users");
  });

  it("create new user and verify reflection", () => {
    userCreationPage.clickElementById("addUserButton");
    userCreationPage.selectFacility("Dummy Shifting Center");
    userCreationPage.typeIntoElementById("username", username);
    userCreationPage.typeIntoElementById("password", "Test@123");
    userCreationPage.selectHomeFacility("Dummy Shifting Center");
    userCreationPage.typeIntoElementById("phone_number", "9999999999");
    userCreationPage.setInputDate("date_of_birth", "date-input", "25081999");
    userCreationPage.selectDropdownOption("user_type", "Doctor");
    userCreationPage.typeIntoElementById("c_password", "Test@123");
    userCreationPage.typeIntoElementById("doctor_qualification", "MBBS");
    userCreationPage.typeIntoElementById("doctor_experience_commenced_on", "2");
    userCreationPage.typeIntoElementById(
      "doctor_medical_council_registration",
      "123456789"
    );
    userCreationPage.typeIntoElementById("first_name", "cypress test");
    userCreationPage.typeIntoElementById("last_name", "staff user");
    userCreationPage.typeIntoElementById("email", "test@test.com");
    userCreationPage.selectDropdownOption("gender", "Male");
    userCreationPage.selectDropdownOption("state", "Kerala");
    userCreationPage.selectDropdownOption("district", "Ernakulam");
    userCreationPage.clickElementById("submit");
    userCreationPage.verifyNotification("User added successfully");
    userPage.typeInSearchInput(username);
    userPage.checkUsernameText(username);
    userCreationPage.verifyElementContainsText("name", "cypress test");
    userCreationPage.verifyElementContainsText("role", "Doctor");
    userCreationPage.verifyElementContainsText("district", "Ernakulam");
    userCreationPage.verifyElementContainsText(
      "home_facility",
      "Dummy Shifting Center"
    );
    userCreationPage.verifyElementContainsText("doctor-qualification", "MBBS");
    userCreationPage.verifyElementContainsText("doctor-experience", "2");
    userCreationPage.verifyElementContainsText(
      "medical-council-registration",
      "123456789"
    );
  });

  it("create new user form throwing mandatory field error", () => {
    userCreationPage.clickElementById("addUserButton");
    userCreationPage.clickElementById("submit");
    userCreationPage.verifyErrorMessages(EXPECTED_ERROR_MESSAGES);
  });

  it("view user redirection from facility page", () => {
    cy.visit("/facility");
    assetSearchPage.typeSearchKeyword(fillFacilityName);
    assetSearchPage.pressEnter();
    facilityPage.verifyFacilityBadgeContent(fillFacilityName);
    facilityPage.visitAlreadyCreatedFacility();
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickViewUsersOption();
    userPage.verifyMultipleBadgesWithSameId(alreadylinkedusersviews);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
