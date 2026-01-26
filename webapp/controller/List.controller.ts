import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";
import MessageBox from "sap/m/MessageBox";
import Router from "sap/ui/core/routing/Router";
import Table from "sap/m/Table";
import Base from "./Base.controller";
import type { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import type { ListBase$ItemPressEvent } from "sap/m/ListBase";
import type ListBinding from "sap/ui/model/ListBinding";
import type { SearchField$SearchEvent } from "sap/m/SearchField";
import type { DetailRouteArgs, Step } from "base/types/pages/main";
import JSONModel from "sap/ui/model/json/JSONModel";
import Tree from "sap/m/Tree";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type { ODataError, ODataResponses } from "base/types/odata";

/**
 * @namespace base.controller
 */

export default class ListController extends Base {
  private Router!: Router;
  private DescendingSort: boolean;
  private product = "0";

  override onInit(): void {
    this.Router = this.getRouter();

    this.DescendingSort = false;


    const oData = new JSONModel();
    this.setModel(oData, "queries");

    oData.attachRequestCompleted(() => {
      const Tree = this.getControlById<Tree>("navtree");
      Tree?.expandToLevel(99);
    });

    // Attach a listener to multiple routes.
    // This ensures that whether the user is on the List, Detail, or Sub-detail page,
    // the list highlights the correct active product.
    this.Router.getRoute("list")?.attachPatternMatched(
      this.onProductMatched,
      this,
    );
    this.Router.getRoute("detail")?.attachPatternMatched(
      this.onProductMatched,
      this,
    );
    this.Router.getRoute("detailDetail")?.attachPatternMatched(
      this.onProductMatched,
      this,
    );

    // Init Nav
    this.Router.navTo("detail", {
      layout: "TwoColumnsMidExpanded",
      product: "b1_init_procurement_needs",
    });
  }

  private flattenList() {}

  // Detail Nav
  public onListItemPress(oEvent: ListBase$ItemPressEvent): void {
    // Use the FCL Helper to determine the next layout state (e.g., transition to 'TwoColumnsBeginExpanded')
    const NextUIState = this.getComponent().getFCLHelper().getNextUIState(1);

    const item = oEvent.getSource().getSelectedItem();
    if (!item) {
      return;
    }

    const ctx = item.getBindingContext("queries");
    if (!ctx) {
      return;
    }

    const productPath = ctx.getPath();
    console.log("Path", productPath);

    this.Router.navTo("detail", {
      layout: NextUIState.layout,
      produc: 1,
    });
  }

  public onSearch(oEvent: SearchField$SearchEvent): void {
    const query = oEvent.getParameter("query") ?? "";
    const filters: Filter[] = [];

    if (query.length > 0) {
      filters.push(new Filter("Name", FilterOperator.Contains, query));
    }

    const table = this.byId("productsTable") as Table;
    const binding = table.getBinding("items") as ListBinding;

    binding.filter(filters, "Application");
  }

  public onAdd(): void {
    MessageBox.show("This functionality is not ready yet.", {
      icon: MessageBox.Icon.INFORMATION,
      title: "Aw, Snap!",
      actions: [MessageBox.Action.OK],
    });
  }

  public onSort(): void {
    this.DescendingSort = !this.DescendingSort;

    const table = this.byId("productsTable") as Table;
    const binding = table.getBinding("items") as ListBinding;

    if (!binding) {
      return;
    }

    const sorter = new Sorter("Name", this.DescendingSort);
    binding.sort(sorter);
  }

  private onProductMatched(Event: Route$PatternMatchedEvent): void {
    const oModel = this.getModel<ODataModel>("steplist");

    const jsonModel = this.getModel("queries");

    oModel.read("/StepListSet", {
      urlParameters: {
        $expand: "ToSubstepList",
      },
      success: (oData: ODataResponses) => {
        const Steps = <Step[]>oData.results || [];

        const FormattedTree = Steps.map((Step) => {
          return {
            text: Step.StepDescr, // Parent title
            type: "folder",
            // Map substeps to the 'children' property
            children: (Step.ToSubstepList?.results || []).map((Sub) => {
              return {
                text: Sub.SubstepDescr, // Child title
                type: "document",
                children: [], // tasks nodes
              };
            }),
          };
        });

        jsonModel.setProperty("/ActiveQueries", FormattedTree);

        const Tree = this.getControlById<Tree>("navtree");
        Tree?.expandToLevel(99);
      },
      error: (oError: ODataError) => {
        const errorMessage = oError.message || "Đã có lỗi xảy ra";
        MessageBox.error(errorMessage);
      },
    });
  }
}
