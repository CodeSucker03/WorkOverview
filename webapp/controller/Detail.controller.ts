import type Router from "sap/ui/core/routing/Router";
import Base from "./Base.controller";
import type Model from "sap/ui/model/Model";
import type { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import type { DetailRouteArgs, FieldValueHelpItem, Step, Task, TreeNode } from "base/types/pages/main";
import type { ListBase$ItemPressEvent } from "sap/m/ListBase";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ComboBox from "sap/m/ComboBox";
import type DatePicker from "sap/m/DatePicker";
import type Input from "sap/m/Input";
import type Select from "sap/m/Select";
import type TextArea from "sap/m/TextArea";
import type TimePicker from "sap/m/TimePicker";
import type { FilterBar$FilterChangeEvent } from "sap/ui/comp/filterbar/FilterBar";
import Filter from "sap/ui/model/Filter";
import type FilterBar from "sap/ui/comp/filterbar/FilterBar";
import type Table from "sap/ui/table/Table";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type { ODataError, ODataResponses } from "base/types/odata";
import FilterOperator from "sap/ui/model/FilterOperator";
import type ListBinding from "sap/ui/model/ListBinding";

/**
 * @namespace base.controller
 */

export default class Detail extends Base {
  private Router: Router;
  private Model: Model;
  private FocusFullScreenButton: boolean;

  private StepId: string;
  private SubstepId: string;

  // Filter
  private filterBar: FilterBar;

  private table: Table;

  override onInit(): void {
    this.Router = this.getRouter();
    this.Model = this.getComponentModel();

    this.table = this.getControlById("table");

    const table = new JSONModel({ Rows: [] });
    this.setModel(table, "table");

    this.setModel(
      new JSONModel({
        // Implement for master data
      }),
      "master"
    );

    this.filterBar = this.getControlById<FilterBar>("filterbarA");

    // Attach a listener to multiple routes.
    // This ensures that whether the user is on the List, Detail, or Sub-detail page,
    // bind the correct element to the detaiol view.
    this.Router.getRoute("list")?.attachPatternMatched(this.onProductMatched);
    this.Router.getRoute("detail")?.attachPatternMatched(this.onProductMatched);
  }

  // Table item press Implemet ?
  public handleItemPress(Event: ListBase$ItemPressEvent) {
    console.log(Event.getSource().getMetadata().getName());
    let oNextUIState = this.getComponent().getFCLHelper().getNextUIState(2);
  }

  // #region Route
  public onProductMatched = (Event: Route$PatternMatchedEvent) => {
    this.getMetadataLoaded()
      .then(() => this.onGetStepData())
      .then(() => this.handleFirstNav())
      .then(() => {
        const args = <DetailRouteArgs>Event.getParameter("arguments");

        const StepId = args.stepId;
        const SubstepId = args.substepId;

        this.StepId = args.stepId;
        this.SubstepId = args.substepId;

        const oModel = this.getModel("queries");
        const Data = <TreeNode[]>oModel.getProperty("/ActiveQueries") || [];

        // 1. Find the Parent Index
        const StepIdx = Data.findIndex((step) => step.id === StepId);

        // 2. Find the Substep Index within that parent
        const SubStep = Data[StepIdx]?.SubStepList || [];
        const SubIdx = SubStep.findIndex((sub) => sub.id === SubstepId);

        // 3. Construct the nested path
        const ResolvedPath = `/ActiveQueries/${StepIdx}/SubStepList/${SubIdx}/`;

        this.getView()?.bindElement({
          path: ResolvedPath,
          model: "queries",
        });

        this.filterBar.fireSearch(); // For BE request
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        // loading off
      });
  };

  private async onGetStepData() {
    return new Promise((resolve, reject) => {
      const oModel = this.getModel<ODataModel>();

      const jsonModel = this.getModel("queries");

      oModel.read("/StepListSet", {
        urlParameters: {
          $expand: "ToSubstepList/ToTaskList",
        },
        success: (oData: ODataResponses) => {
          const Steps = <Step[]>oData.results || [];

          // Map response to jsonModel
          const FormattedTree = Steps.map((Step) => {
            return {
              text: Step.StepDescr, // Parent title
              type: "folder",
              id: Step.Step,
              // Map substeps to the 'children' property
              SubStepList: (Step.ToSubstepList?.results || []).map((Sub) => {
                return {
                  text: Sub.SubstepDescr, // Child title
                  type: "document",
                  id: Sub.Substep,

                  stepId: Step.Step,
                  TaskList: (Sub.ToTaskList?.results || []).map((task: Task) => {
                    return {
                      ...task, // Spreads all properties: WiText, WiPrio, WiStat, etc.
                    };
                  }), // tasks nodes
                };
              }),
            };
          });

          jsonModel.setProperty("/ActiveQueries", FormattedTree);

          resolve(true);
        },
        error: (error: ODataError) => {
          reject(error);
        },
      });
    });
  }

  // #region Filters
  public onSelectionChange(event: FilterBar$FilterChangeEvent) {
    this.filterBar.fireEvent("filterChange", event);
  }

  public getFilters() {
    const filters = this.filterBar.getFilterGroupItems().reduce<Filter[]>((acc, item) => {
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

  // #region Formatters
  public statusText(Status: string) {
    const mStatus: Record<string, string> = {
      WAITING: "Waiting",
      READY: "Ready",
      SELECTED: "Accepted",
      STARTED: "In Process",
      ERROR: "Error",
      COMMITTED: "Executed",
      COMPLETED: "Completed",
      CANCELLED: "Logically Deleted",
      CHECKED: "In Preparation",
      EXPCAUGHT: "Exception Caught",
      EXPHANDLR: "Exception Active",
    };
    return mStatus[Status] || Status;
  }

  public statusState(Status: string) {
    switch (Status) {
      case "READY":
      case "COMMITTED":
      case "COMPLETED":
        return "Success"; // Green
      case "STARTED":
      case "CHECKED":
        return "Information"; // Blue
      case "WAITING":
      case "SELECTED":
        return "None"; // Grey/Neutral
      case "ERROR":
      case "EXPCAUGHT":
      case "EXPHANDLR":
        return "Error"; // Red
      case "CANCELLED":
        return "Warning"; // Orange
      default:
        return "None";
    }
  }

  public priorityText(Priority: string) {
    const mPriority: Record<string, string> = {
      "1": " Highest - Express",
      "2": " Very high",
      "3": " Higher",
      "4": " High",
      "5": " Medium",
      "6": " Low",
      "7": " Lower",
      "8": " Very low",
      "9": " Lowest",
    };
    return mPriority[Priority] || Priority;
  }

  /**
   * Returns semantic state based on priority level
   */
  public priorityState(Priority: string) {
    const Prio = parseInt(Priority, 2);
    if (Prio <= 3) return "Error"; // Red for High/Express
    if (Prio <= 5) return "Warning"; // Orange for Medium
    if (Prio <= 9) return "Success"; // Green for Low
    return "None";
  }

  // #endregion Formatters

  private handleFirstNav() {
    // Map your data to the tree model as usual
    const oModel = this.getModel("queries");
    const modelData = <TreeNode[]>oModel.getProperty("/ActiveQueries") || [];

    //  Get the current hash from the router
    const CurrentHash = this.Router.getHashChanger().getHash();
    console.log("Hash ", CurrentHash);

    // ONLY navigate if the hash is empty (Initial App Load)
    if (!CurrentHash || CurrentHash === "") {
      if (modelData.length > 0 && modelData[0].SubStepList.length > 0) {
        const firstStep = modelData[0];
        const firstSubstep = modelData[0].SubStepList[0];

        this.Router.navTo(
          "detail",
          {
            layout: "TwoColumnsMidExpanded",
            stepId: firstStep.id,
            substepId: firstSubstep.id,
          },
          true
        ); // The 'true' argument replaces the history state
      }
    }
  }

  public onSearch() {
    const oDataModel = this.getModel<ODataModel>();
    const tableModel = this.getModel<JSONModel>("table");

    const dynamicFilters = this.getFilters();
    const fixedFilters = [
      new Filter("Step", FilterOperator.EQ, this.StepId),
      new Filter("Substep", FilterOperator.EQ, this.SubstepId),
    ];

    const allFilters = [...fixedFilters, ...dynamicFilters];

    console.log("Filter values", allFilters);

    // get taskList table BE odata
    this.table.setBusy(true);
    oDataModel.read("/TaskListSet", {
      filters: fixedFilters,
      success: (oData: ODataResponses) => {
        tableModel.setProperty("/Rows", oData.results);
        console.log(tableModel.getData());
        this.table.setBusy(false);
      },
      error: (Error: ODataError) => {
        console.error(Error);
        this.table.setBusy(false);
      },
    });

    // Filter through binding
    const Binding = <ListBinding>this.table.getBinding("rows");
    if (!Binding) {
      return;
    }
    Binding.filter(allFilters, "Application");
  }

  public onRefresh() {
    this.filterBar.fireSearch();
  }

  // Get table data with view binding path
  private setTableData(StepIdx: number, SubIdx: number) {
    const model = this.getModel("queries");
    const TaskData = <Task[]>model?.getProperty(`/ActiveQueries/${StepIdx}/SubStepList/${SubIdx}/TaskList`);

    const tableModel = this.getModel("table");
    tableModel.setProperty("/Rows", TaskData);
    console.log("Task List", TaskData);
  }

  // #region Master data
  private async onGetMasterData() {
    return new Promise((resolve, reject) => {
      const oDataModel = this.getModel<ODataModel>();
      const masterModel = this.getModel("master");

      oDataModel.read("/FieldValueHelpSet", {
        success: (response: ODataResponses<FieldValueHelpItem[]>) => {
          const Status: FieldValueHelpItem[] = [];
          const Priority: FieldValueHelpItem[] = [];
          const From: FieldValueHelpItem[] = [];
          const ForwardedBy: FieldValueHelpItem[] = [];

          response.results.forEach((item) => {
            switch (item.FieldName) {
              case "Status": {
                Status.push(item);
                break;
              }

              case "Priority": {
                Priority.push(item);
                break;
              }

              case "From": {
                From.push(item);
                break;
              }
              case "Forwarded By": {
                ForwardedBy.push(item);
                break;
              }
              default:
                break;
            }
          });

          masterModel.setProperty("/Status", Status);
          masterModel.setProperty("/Priority", Priority);
          masterModel.setProperty("/From", From);
          masterModel.setProperty("/ForwardedBy", ForwardedBy);

          console.log("Master data loaded:", masterModel.getData());

          resolve(true);
        },
        error: (error: ODataError) => {
          reject(error);
        },
      });
    });
  }
  // #endregion Master data
}
