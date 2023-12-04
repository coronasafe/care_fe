// FacilityCreation
import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";
import FacilityPage from "../../pageobject/Facility/FacilityCreation";
import LoginPage from "../../pageobject/Login/LoginPage";
import FacilityHome from "../../pageobject/Facility/FacilityHome";
import ManageUserPage from "../../pageobject/Users/ManageUserPage";
import { UserCreationPage } from "../../pageobject/Users/UserCreation";

describe("Facility Creation", () => {
  let facilityUrl1: string;
  const facilityPage = new FacilityPage();
  const loginPage = new LoginPage();
  const facilityHome = new FacilityHome();
  const manageUserPage = new ManageUserPage();
  const userCreationPage = new UserCreationPage();
  const facilityFeature = [
    "CT Scan",
    "X-Ray",
    "Maternity Care",
    "Neonatal Care",
    "Operation Theater",
    "Blood Bank",
  ];
  const bedCapacity = "10";
  const bedOccupancy = "5";
  const oxygenCapacity = "100";
  const oxygenExpected = "80";
  const totalCapacity = "20";
  const totalOccupancy = "10";
  const doctorCapacity = "5";
  const totalDoctor = "10";
  const facilityName = "cypress facility";
  const facilityAddress = "cypress address";
  const facilityNumber = "9898469865";
  const facilityErrorMessage = [
    "Required",
    "Invalid Pincode",
    "Required",
    "Required",
    "Required",
    "Required",
    "Required",
    "Required",
    "Invalid Phone Number",
  ];
  const bedErrorMessage = [
    "Field is required",
    "Total capacity cannot be 0",
    "Field is required",
  ];
  const doctorErrorMessage = ["Field is required", "Field is required"];

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.restoreLocalStorage();
    cy.awaitUrl("/facility");
  });

  it("Create a new facility with multiple bed and doctor capacity", () => {
    // create facility with multiple capacity and verify form error message for facility form
    facilityPage.visitCreateFacilityPage();
    facilityPage.submitForm();
    userCreationPage.verifyErrorMessages(facilityErrorMessage);
    facilityPage.fillFacilityName(facilityName);
    facilityPage.clickfacilityfeatureoption();
    facilityFeature.forEach((featureText) => {
      cy.get("[role='option']").contains(featureText).click();
    });
    facilityPage.fillPincode("682001");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress(facilityAddress);
    facilityPage.fillPhoneNumber(facilityNumber);
    facilityPage.fillOxygenCapacity(oxygenCapacity);
    facilityPage.fillExpectedOxygenRequirement(oxygenExpected);
    facilityPage.fillBTypeCylinderCapacity(oxygenCapacity);
    facilityPage.fillExpectedBTypeCylinderRequirement(oxygenExpected);
    facilityPage.fillCTypeCylinderCapacity(oxygenCapacity);
    facilityPage.fillExpectedCTypeCylinderRequirement(oxygenExpected);
    facilityPage.fillDTypeCylinderCapacity(oxygenCapacity);
    facilityPage.fillExpectedDTypeCylinderRequirement(oxygenExpected);
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    // create multiple bed capacity and verify card reflection
    facilityPage.selectBedType("Oxygen beds");
    facilityPage.fillTotalCapacity(bedCapacity);
    facilityPage.fillCurrentlyOccupied(bedOccupancy);
    facilityPage.clickbedcapcityaddmore();
    facilityPage.selectBedType("Ordinary Bed");
    facilityPage.fillTotalCapacity(bedCapacity);
    facilityPage.fillCurrentlyOccupied(bedOccupancy);
    facilityPage.clickbedcapcityaddmore();
    facilityPage.getTotalBedCapacity().contains(totalCapacity);
    facilityPage.getTotalBedCapacity().contains(totalOccupancy);
    facilityPage.clickcancelbutton();
    // create multiple bed capacity and verify card reflection
    facilityPage.selectAreaOfSpecialization("General Medicine");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    facilityPage.selectAreaOfSpecialization("Pulmonology");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.clickdoctorcapacityaddmore();
    facilityPage.getTotalDoctorCapacity().contains(doctorCapacity);
    facilityPage.clickcancelbutton();
    facilityPage.verifyfacilitynewurl();
    // verify the facility card
    facilityPage.getFacilityName().contains(facilityName).should("be.visible");
    facilityPage
      .getAddressDetailsView()
      .contains(facilityAddress)
      .should("be.visible");
    facilityPage
      .getPhoneNumberView()
      .contains(facilityNumber)
      .should("be.visible");
    facilityPage
      .getFacilityAvailableFeatures()
      .invoke("text")
      .then((text) => {
        facilityFeature.forEach((feature) => {
          expect(text).to.contain(feature);
        });
      });
    facilityPage.getFacilityOxygenInfo().scrollIntoView();
    facilityPage
      .getFacilityOxygenInfo()
      .contains(oxygenCapacity)
      .should("be.visible");
    facilityPage.getFacilityTotalBedCapacity().scrollIntoView();
    facilityPage.getFacilityTotalBedCapacity().contains(totalCapacity);
    facilityPage.getFacilityTotalBedCapacity().contains(totalOccupancy);
    facilityPage.getFacilityTotalDoctorCapacity().scrollIntoView();
    facilityPage.getFacilityTotalDoctorCapacity().contains(totalDoctor);
  });

  it("Create a new facility with single bed and doctor capacity", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName(facilityName);
    facilityPage.fillPincode("682001");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress(facilityAddress);
    facilityPage.fillPhoneNumber(facilityNumber);
    facilityPage.submitForm();
    // add the bed capacity
    facilityPage.selectBedType("Oxygen beds");
    facilityPage.fillTotalCapacity(oxygenCapacity);
    facilityPage.fillCurrentlyOccupied(oxygenExpected);
    facilityPage.saveAndExitBedCapacityForm();
    // add the doctor capacity
    facilityPage.selectAreaOfSpecialization("General Medicine");
    facilityPage.fillDoctorCount(doctorCapacity);
    facilityPage.saveAndExitDoctorForm();
    facilityPage.verifyfacilitynewurl();
    // verify the created facility details
    facilityPage.getFacilityName().contains(facilityName).should("be.visible");
    facilityPage
      .getAddressDetailsView()
      .contains(facilityAddress)
      .should("be.visible");
    facilityPage
      .getPhoneNumberView()
      .contains(facilityNumber)
      .should("be.visible");
    // verify the facility homepage
    cy.visit("/facility");
    manageUserPage.typeFacilitySearch(facilityName);
    facilityPage.verifyFacilityBadgeContent(facilityName);
    manageUserPage.assertFacilityInCard(facilityName);
    facilityHome.verifyURLContains(facilityName);
  });

  it("Create a new facility with no bed and doctor capacity", () => {
    facilityPage.visitCreateFacilityPage();
    facilityPage.fillFacilityName(facilityName);
    facilityPage.fillPincode("682001");
    facilityPage.selectLocalBody("Aluva");
    facilityPage.selectWard("4");
    facilityPage.fillAddress(facilityAddress);
    facilityPage.fillPhoneNumber(facilityNumber);
    facilityPage.submitForm();
    // add no bed capacity and verify form error message
    facilityPage.isVisibleselectBedType();
    facilityPage.saveAndExitBedCapacityForm();
    userCreationPage.verifyErrorMessages(bedErrorMessage);
    facilityPage.clickcancelbutton();
    // add no doctor capacity and verify form error message
    facilityPage.isVisibleAreaOfSpecialization();
    facilityPage.saveAndExitDoctorForm();
    userCreationPage.verifyErrorMessages(doctorErrorMessage);
    facilityPage.clickcancelbutton();
    cy.url().then((newUrl) => {
      facilityUrl1 = newUrl;
    });
    // verify the created facility details
    facilityPage.getFacilityName().contains(facilityName).should("be.visible");
    facilityPage
      .getAddressDetailsView()
      .contains(facilityAddress)
      .should("be.visible");
    facilityPage
      .getPhoneNumberView()
      .contains(facilityNumber)
      .should("be.visible");
  });

  it("Update the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickUpdateFacilityOption();
    facilityPage.clickUpdateFacilityType("Request Approving Center");
    facilityPage.fillFacilityName("cypress facility updated");
    facilityPage.fillAddress("Cypress Facility Updated Address");
    facilityPage.fillOxygenCapacity("100");
    facilityPage.fillExpectedOxygenRequirement("80");
    facilityPage.selectLocation("Kochi, Kerala");
    facilityPage.submitForm();
    cy.url().should("not.include", "/update");
  });

  it("Configure the existing facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickConfigureFacilityOption();
    facilityPage.fillMiddleWareAddress("dev_middleware.coronasafe.live");
    facilityPage.clickupdateMiddleWare();
    facilityPage.verifySuccessNotification("Facility updated successfully");
  });

  it("Delete a facility", () => {
    facilityPage.visitUpdateFacilityPage(facilityUrl1);
    facilityPage.clickManageFacilityDropdown();
    facilityPage.clickDeleteFacilityOption();
    facilityPage.confirmDeleteFacility();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
