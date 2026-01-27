import type Router from "sap/ui/core/routing/Router";
import Base from "./Base.controller";
import type { FlexibleColumnLayout$StateChangeEvent } from "sap/f/FlexibleColumnLayout";
import type {
  Router$BeforeRouteMatchedEvent,
  Router$RouteMatchedEvent,
} from "sap/ui/core/routing/Router";
import type { UIState } from "sap/f/FlexibleColumnLayoutSemanticHelper";
import type { DetailRouteArgs} from "base/types/pages/main";

/**
 * @namespace base.controller
 */

export default class FlexibleColumnLayout extends Base {
  private Router: Router;

  private currentRouteName?: string;
  private stepId?: string;
  private substepId?: string;
  private currentLayout?: string;

  public override onInit(): void {
    this.Router = this.getRouter();

    this.Router.attachRouteMatched(this.onRouteMatched);
    this.Router.attachBeforeRouteMatched(this.onBeforeRouteMatched);

  }

  // onBeforeRouteMatched → layout decision
  /**
   * Triggered BEFORE the route is matched. Since its container view it will run before any route match
   * Used to set up the initial layout (e.g., OneColumn or TwoColumnsBeginExpanded)
   * before the view is even displayed.
   */
  private onBeforeRouteMatched = (oEvent: Router$BeforeRouteMatchedEvent) => {
    const oModel = this.getModel("layout");
    const args = <DetailRouteArgs>oEvent.getParameter("arguments");
    const name = oEvent.getParameter("name");

    console.log("layout before route match", args, name);

    let Layout = args?.layout;

    // If no layout is defined in the URL, ask the FCL Helper for the default initial state
    // "EndColumnFullScreen" default
    if (!Layout) {
      const oNextUIState = this.getComponent().getFCLHelper().getNextUIState(0);
      Layout = oNextUIState.layout;
    }

    // Sync the model so the UI knows which columns to show/hide
    if (Layout) {
      oModel?.setProperty("/layout", Layout);
    }
  };

  /**
   * Triggered when the route is matched.
   * Used to "cache" the current route information so it can be reused later
   * if the user changes the layout manually.
   */
  private onRouteMatched = (oEvent: Router$RouteMatchedEvent) => {
    const RouteName = oEvent.getParameter("name");
    const args = <DetailRouteArgs>oEvent.getParameter("arguments");
    console.log("routematchargs", args.layout, RouteName);

    // Store parameters in class variables for use in 'onStateChanged'
    this.currentRouteName = RouteName;
    this.stepId = args?.stepId;
    this.substepId = args?.substepId;
    this.currentLayout = args?.layout;

    // Refresh visibility of action buttons (close/full-screen) based on current state
    this.updateUIElements();
  };

  /**
   * Triggered when the user interacts with the layout directly and first time load.
   * Example: Clicking the "Expand" arrow or "Close" button on a column.
   */
  public onStateChanged(Event: FlexibleColumnLayout$StateChangeEvent): void {
    const isNavigationArrow = Event.getParameter(
      "isNavigationArrow"
    ) as boolean;
    const Layout = Event.getParameter("layout") as string;
    console.log("Interact change", Layout);

    this.updateUIElements();

    // If the change came from a navigation arrow, update the URL to match the new layout
    // This ensures that if the user hits "Refresh", the layout remains the same.
    if (isNavigationArrow && this.currentRouteName) {
      this.Router.navTo(
        this.currentRouteName,
        {
          layout: Layout,
          stepId: this.stepId,
          substepId: this.substepId,
        },
        true // Replace history so the back button doesn't get cluttered with layout changes
      );
    }
  }

  /**
   * Internal helper to sync the UI Model with the FlexibleColumnLayout Helper.
   * It determines which control buttons (like 'Exit Full Screen') should be visible.
   */
  private updateUIElements(): void {
    const Model = this.getModel("layout");

    // Get the current UI state (visibility of columns, action buttons, etc.) from the FCL Helper
    const oUIState: UIState = this.getComponent()
      .getFCLHelper()
      .getCurrentUIState();
    // Update the model to reflect these changes in the View

    Model.setData(oUIState);

    // Special 1st navigate case
    if (this.currentRouteName === "detail") {
      Model.setProperty("/layout", this.currentLayout);
    }
  }
}
