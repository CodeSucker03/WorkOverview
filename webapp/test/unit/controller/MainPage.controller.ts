/*global QUnit*/
import Controller from "base/controller/FlexibleColumnLayout.controller";

QUnit.module("FlexibleColumnLayout Controller");

QUnit.test("I should test the Main controller", function (assert: Assert) {
	const oAppController = new Controller("FlexibleColumnLayout");
	oAppController.onInit();
	assert.ok(oAppController);
});