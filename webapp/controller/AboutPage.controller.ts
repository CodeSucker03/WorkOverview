
import Router from "sap/ui/core/routing/Router";
import Model from "sap/ui/model/Model";
import Base from "./Base.controller";

/**
 * @namespace base.controller
 */
export default class AboutPage extends Base {
  private Router: Router;
  private Model: Model;

  override onInit(): void {
    this.Router = this.getRouter();
    this.Model = this.getComponentModel();
  }

  public handleClose(): void {
    window.history.go(-1);
  }

  public onBack(): void {
    window.history.go(-1);
  }
}
