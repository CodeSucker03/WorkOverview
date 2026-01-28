export interface DetailRouteArgs {
  stepId: string;
  substepId: string;
  layout?: string;
}

interface ODataMetadata {
  id: string;
  uri: string;
  type: string;
}

export interface RouteArguments {}

export interface Task {
  __metadata: ODataMetadata;
  Step: string;
  Substep: string;
  Task: string;
  TaskDescr: string;
  WiText: string;
  WiId: string;
  WiCd: string;
  WiCt: string; // ISO 8601 duration format (e.g., "PT00H00M00S")
  WiPrio: string;
  WiStat: string;
  WiAed: string; // Date/Time info
  WiForwBy: string;
  Screen: string;
  Magms: string;
  Mancc: string;
}

export interface TaskListResults {
  results: Task[];
}

/**
 * Interface for the nested Substep items (Level 2)
 */
export interface Substep {
  __metadata: ODataMetadata;
  Step: string; // e.g., "STEP01"
  Substep: string; // e.g., "SSTEP1.1"
  SubstepDescr: string; // e.g., "XÂY DỰNG ĐẦU BÀI CHI TIẾT"
  ToTaskList: TaskListResults;
}

/**
 * Navigation property wrapper for Substeps
 */
export interface ToSubstepList {
  results: Substep[];
}

/**
 * Interface for the main Step items (Level 1)
 */
export interface Step {
  __metadata?: ODataMetadata;
  Step: string; // e.g., "STEP01"
  type: "folder" | "document";
  StepDescr: string; // e.g., "PHÊ DUYỆT ĐẦU BÀI CHI TIẾT"
  ToSubstepList: ToSubstepList;
}

/**
 * Represents a single node in the Navigation Tree.
 * Can be a Folder (Step) or a Document (Substep).
 */
export interface TreeNode {
  text: string;
  type: "folder" | "document";
  id: string;
  // stepId is optional because parents (Folders) don't have a parent stepId
  stepId?: string;
  // Recursive property: children contains more TreeNode objects
  SubStepList: TreeNode[];
}

/**
 * The structure for the "queries" JSONModel
 */
export interface QueriesModelData {
  ActiveQueries: TreeNode[];
}

export interface FieldValueHelpItem {
  FieldKey: string;
  FieldValue: string;
  FieldName: string;
}
