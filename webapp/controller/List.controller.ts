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
import type { TreeNode } from "base/types/pages/main";
import Tree from "sap/m/Tree";


/**
 * @namespace base.controller
 */

export default class ListController extends Base {
  private Router!: Router;
  private DescendingSort: boolean;

  private tree: Tree;

  override onInit(): void {
    this.Router = this.getRouter();

    this.DescendingSort = false;

    // Attach a listener to multiple routes.
    // This ensures that whether the user is on the List, Detail, or Sub-detail page,
    // the list highlights the correct active product.
    this.Router.getRoute("list")?.attachPatternMatched(this.onProductMatched);
    this.Router.getRoute("detail")?.attachPatternMatched(this.onProductMatched);

    this.tree = this.getControlById<Tree>("navtree");

    // Init Navigate
  }

  // Detail Nav
  public onListItemPress(oEvent: ListBase$ItemPressEvent): void {
    const item = oEvent.getSource().getSelectedItem();
    if (!item) {
      return;
    }

    const ctx = item.getBindingContext("queries");
    if (!ctx) {
      return;
    }
    const Node = <TreeNode>ctx.getObject();

    // Only navigate if it's a document (substep)
    if (Node.type === "document") {
      this.Router.navTo("detail", {
        layout: "TwoColumnsMidExpanded",
        stepId: Node.stepId, 
        substepId: Node.id, // The specific substep ID (e.g., SSTEP1.1)
      });
    }
  }

  // Search in list
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

  private onProductMatched = (Event: Route$PatternMatchedEvent) => {
    this.tree.setBusy(true);
    this.getMetadataLoaded()
      .then(() => {
        this.tree.setBusy(false);

        this.tree.expandToLevel(99);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        // loading off
      });
  };
}
