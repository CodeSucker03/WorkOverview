import type Router from "sap/ui/core/routing/Router";
import Base from "./Base.controller";
import type Model from "sap/ui/model/Model";
import type { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import type { DetailRouteArgs } from "base/types/pages/main";
import type { ListBase$ItemPressEvent } from "sap/m/ListBase";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { FilterPayload } from "base/types/filter";
import type CheckBox from "sap/m/CheckBox";
import type ComboBox from "sap/m/ComboBox";
import type DatePicker from "sap/m/DatePicker";
import type Input from "sap/m/Input";
import type MultiComboBox from "sap/m/MultiComboBox";
import type MultiInput from "sap/m/MultiInput";
import type Select from "sap/m/Select";
import type Switch from "sap/m/Switch";
import type TextArea from "sap/m/TextArea";
import type TimePicker from "sap/m/TimePicker";
import Token from "sap/m/Token";
import type { FilterBar$FilterChangeEvent } from "sap/ui/comp/filterbar/FilterBar";
import type FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import Filter from "sap/ui/model/Filter";
import type Label from "sap/m/Label";
import type FilterBar from "sap/ui/comp/filterbar/FilterBar";
import type Table from "sap/ui/table/Table";

/**
 * @namespace base.controller
 */

export default class Detail extends Base {
  private Router: Router;
  private Model: Model;
  private FocusFullScreenButton: boolean;
  private product: string;

  // Filter
  private expandedLabel: Label;
  private snappedLabel: Label;
  private filterBar: FilterBar;
  private table: Table;

  override onInit(): void {
    this.Router = this.getRouter();
    this.Model = this.getComponentModel();

    const table = new JSONModel({ tableRow: [] });
    this.setModel(table, "table");

    this.setModel(
      new JSONModel({
        // Implement
      }),
      "master",
    );

    // Filters
    this.expandedLabel = this.getControlById<Label>("expandedLabel");
    this.snappedLabel = this.getControlById<Label>("snappedLabel");
    this.filterBar = this.getControlById<FilterBar>("filterBar");

    // Filter initialize
    this.filterBar.registerFetchData(this.fetchData);
    this.filterBar.registerApplyData(this.applyData);
    this.filterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

    // Attach a listener to multiple routes.
    // This ensures that whether the user is on the List, Detail, or Sub-detail page,
    // bind the correct element to the detaiol view.
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
  }

  public handleItemPress(oEvent: ListBase$ItemPressEvent) {
    console.log(oEvent.getSource().getMetadata().getName());
    let oNextUIState = this.getComponent().getFCLHelper().getNextUIState(2);

    let bindingContext = oEvent
      .getParameter("listItem")
      ?.getBindingContext("products");
    let supplierPath = bindingContext?.getPath() || "";

    // Extract the ID/index from the end of the path (e.g., "products/5" -> "5")
    let supplier = supplierPath.split("/").slice(-1).pop();

    console.log(
      "Detailed pressed",
      supplierPath,
      supplier,
      oNextUIState.layout,
    );

    this.Router.navTo("detailDetail", {
      layout: oNextUIState.layout,
      product: this.product,
      supplier: supplier,
    });
  }

  public onProductMatched(oEvent: Route$PatternMatchedEvent) {
    const args = oEvent.getParameter("arguments") as DetailRouteArgs;

    this.product = args.product || this.product || "0";

    // fix detail route to have 3 parameters step substeps desc ?
    this.getView()?.bindElement({
      path: "/ActiveQueries/" + this.product,
      model: "queries",
    });
  }

  private flattenList() {}

  // #region Filters
  /**
   * Get value fields to create new filter variant
   */
  private fetchData = () => {
    return this.filterBar
      .getAllFilterItems(false)
      .reduce<FilterPayload[]>((acc, item: FilterGroupItem) => {
        const control = item.getControl();
        const groupName = item.getGroupName();
        const fieldName = item.getName();

        if (control) {
          let fieldData: string | string[] = "";

          switch (true) {
            case this.isControl<Input>(control, "sap.m.Input"): {
              fieldData = control.getValue();
              break;
            }

            case this.isControl<TextArea>(control, "sap.m.TextArea"): {
              fieldData = control.getValue();
              break;
            }

            case this.isControl<MultiInput>(control, "sap.m.MultiInput"): {
              fieldData = control.getTokens().map((token) => token.getKey());
              break;
            }

            case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
              fieldData = control.getValue();
              break;
            }

            case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
              fieldData = control.getValue();
              break;
            }

            case this.isControl<MultiComboBox>(
              control,
              "sap.m.MultiComboBox",
            ): {
              fieldData = control.getSelectedKeys();
              break;
            }

            case this.isControl<Select>(control, "sap.m.Select"): {
              fieldData = control.getSelectedKey();
              break;
            }

            case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
              fieldData = control.getSelectedKey();
              break;
            }

            case this.isControl<CheckBox>(control, "sap.m.CheckBox"): {
              fieldData = control.getSelected().toString();
              break;
            }

            case this.isControl<Switch>(control, "sap.m.Switch"): {
              fieldData = control.getState().toString();
              break;
            }
            default:
              break;
          }

          acc.push({
            groupName,
            fieldName,
            fieldData,
          });
        }

        return acc;
      }, []);
  };

  /**
   * Apply value fields from filter variant
   */
  private applyData = (data: unknown) => {
    (<FilterPayload[]>data).forEach((item) => {
      const { groupName, fieldName, fieldData } = item;
      const control = this.filterBar.determineControlByName(
        fieldName,
        groupName,
      );

      switch (true) {
        case this.isControl<Input>(control, "sap.m.Input"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<TextArea>(control, "sap.m.TextArea"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<MultiInput>(control, "sap.m.MultiInput"): {
          const tokens = (<string[]>fieldData).map(
            (key) => new Token({ key, text: key }),
          );
          control.setTokens(tokens);
          break;
        }

        case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
          control.setValue(<string>fieldData);
          break;
        }

        case this.isControl<MultiComboBox>(control, "sap.m.MultiComboBox"): {
          control.setSelectedKeys(<string[]>fieldData);
          break;
        }

        case this.isControl<Select>(control, "sap.m.Select"): {
          control.setSelectedKey(<string>fieldData);
          break;
        }

        case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
          control.setSelectedKey(<string>fieldData);
          break;
        }

        case this.isControl<CheckBox>(control, "sap.m.CheckBox"): {
          control.setSelected();
          break;
        }

        case this.isControl<Switch>(control, "sap.m.Switch"): {
          control.setState();
          break;
        }
        default:
          break;
      }
    });
  };

  // Get filters with values to display in labels
  private getFiltersWithValues = () => {
    return this.filterBar
      .getFilterGroupItems()
      .reduce<FilterGroupItem[]>((acc, item) => {
        const control = item.getControl();

        if (control) {
          switch (true) {
            case this.isControl<Input>(control, "sap.m.Input"): {
              const value = control.getValue();

              if (value) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<TextArea>(control, "sap.m.TextArea"): {
              const value = control.getValue();

              if (value) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<MultiInput>(control, "sap.m.MultiInput"): {
              const tokens = control.getTokens();

              if (tokens.length) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<DatePicker>(control, "sap.m.DatePicker"): {
              const value = control.getValue();

              if (value) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
              const value = control.getValue();

              if (value) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<MultiComboBox>(
              control,
              "sap.m.MultiComboBox",
            ): {
              const keys = control.getSelectedKeys();

              if (keys.length) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<Select>(control, "sap.m.Select"): {
              const key = control.getSelectedKey();

              if (key) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
              const key = control.getSelectedKey();

              if (key) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<CheckBox>(control, "sap.m.CheckBox"): {
              const value = control.getSelected().toString();

              if (value) {
                acc.push(item);
              }
              break;
            }

            case this.isControl<Switch>(control, "sap.m.Switch"): {
              const value = control.getState().toString();

              if (value) {
                acc.push(item);
              }
              break;
            }
            default:
              break;
          }
        }

        return acc;
      }, []);
  };

  public onSelectionChange(event: FilterBar$FilterChangeEvent) {
    this.filterBar.fireEvent("filterChange", event);
  }

  public onFilterChange() {
    this.updateLabelsAndTable();
  }

  public onAfterVariantLoad() {
    this.updateLabelsAndTable();
  }

  private updateLabelsAndTable() {
    const expandedLabel =
      this.filterBar.retrieveFiltersWithValuesAsTextExpanded();
    const snappedLabel = this.filterBar.retrieveFiltersWithValuesAsText();

    this.expandedLabel.setText(expandedLabel);
    this.snappedLabel.setText(snappedLabel);

    this.table.setShowOverlay(true);
  }

  public getFilters() {
    const filters = this.filterBar
      .getFilterGroupItems()
      .reduce<Filter[]>((acc, item) => {
        const control = item.getControl();
        const name = item.getName();

        switch (true) {
          case this.isControl<Input>(control, "sap.m.Input"):
          case this.isControl<TextArea>(control, "sap.m.TextArea"): {
            const value = control.getValue();

            if (value) {
              acc.push(new Filter(name, "Contains", value));
            }

            break;
          }

          case this.isControl<DatePicker>(control, "sap.m.DatePicker"):
          case this.isControl<TimePicker>(control, "sap.m.TimePicker"): {
            const value = control.getValue();

            if (value) {
              acc.push(new Filter(name, "EQ", value));
            }

            break;
          }

          case this.isControl<Select>(control, "sap.m.Select"):
          case this.isControl<ComboBox>(control, "sap.m.ComboBox"): {
            const value = control.getSelectedKey();

            if (value) {
              acc.push(new Filter(name, "EQ", value));
            }

            break;
          }
          default:
            break;
        }

        return acc;
      }, []);

    return filters;
  }
  // #endregion Filters

  // #region extras
  public handleFullScreen() {
    this.FocusFullScreenButton = true;
    let NextLayout = this.Model.getProperty(
      "/actionButtonsInfo/midColumn/fullScreen",
    );
    this.Router.navTo("detail", { layout: NextLayout, product: this.product });
  }

  public handleExitFullScreen() {
    this.FocusFullScreenButton = true;
    let NextLayout = this.Model.getProperty(
      "/actionButtonsInfo/midColumn/exitFullScreen",
    );
    this.Router.navTo("detail", { layout: NextLayout, product: this.product });
  }

  public handleClose() {
    let NextLayout = this.Model.getProperty(
      "/actionButtonsInfo/midColumn/closeColumn",
    );
    this.Router.navTo("list", { layout: NextLayout });
  }
  // #endregion extras
}
