import { TextEncoder } from "util";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let createScript = vscode.commands.registerCommand(
    // Execute `CreateScript`
    "efcore-model-converter.createScript",
    () => {
      CreateScript();
    }
  );

  context.subscriptions.push(createScript);
}

function CreateScript() {
  let scriptFilePath: string | undefined =
    vscode.window.activeTextEditor?.document.fileName;

  let scriptText: string[] = [];

  // Not Found File
  if (scriptFilePath !== undefined) {
    vscode.workspace
      .openTextDocument(vscode.Uri.file(scriptFilePath.toString()))
      .then((document) => {
        let text: string[] = document.getText().split("\n");

        let fileExtension: string | undefined =
          vscode.window.activeTextEditor?.document.languageId;

        if (fileExtension === "sql") {
          convertEfCoreModel(text);
        } else if (fileExtension === "csharp") {
          convetSqlScript(text);
        } else {
          vscode.window.showInformationMessage(
            "It's a language that I don't support."
          );
        }
      });
  }
}

// Ef Model to Sql Script
function convetSqlScript(scriptText: string[]) {
  let lineArray: string[] = scriptText;
  let scriptArray: string[] = [];
  let tempBuiltinAttribute: string = "";

  lineArray.forEach((element) => {
    if (
      // Ignore C Sharp Keyword.
      element.indexOf("using") > -1 ||
      element.indexOf("namespace") > -1 ||
      element.indexOf("//") > -1
    ) {
    } else {
      element = removeEfAccessModifier(element);
      element = removeEfString(element);

      if (element.indexOf("class") > -1) {
        element = removeEfKeyword(element);
        scriptArray.push("CREATE TABLE " + element.trim() + "(\n");
      } else {
        // Built-in attributes
        let builtinAttribute = getBuiltinAttribute(element);
        // If builtinAttribute Same Line property.
        if (element.trim() !== "") {
          // [Key] public string TEST_1 { get; set; }
          // [Required] public string TEST_2 { get; set; }
          if (tempBuiltinAttribute.trim() !== "") {
            // If BuiltinAttribute == [Key]
            if (tempBuiltinAttribute.indexOf("Key") > -1) {
              element = removeEfBuiltinAttribute(element);
              // Sql Primary Key
              scriptArray.push(
                "  " + replaceEfType(element) + " PRIMARY KEY NOT NULL,\n"
              );

              // Init Temp BuiltinAttribute
              tempBuiltinAttribute = "";
            } else if (tempBuiltinAttribute.indexOf("Required") > -1) {
              // If BuiltinAttribute == [Required]
              element = removeEfBuiltinAttribute(element);
              scriptArray.push("  " + replaceEfType(element) + " NOT NULL,\n");

              // Init Temp BuiltinAttribute
              tempBuiltinAttribute = "";
            }
          } else {
            // [Key]
            // public string TEST_1 { get; set; }
            // [Required]
            // public string TEST_2 { get; set; }
            if (removeEfBuiltinAttribute(element).length > 0) {
              if (builtinAttribute.indexOf("Key") > -1) {
                element = removeEfBuiltinAttribute(element);
                scriptArray.push(
                  replaceEfType(element) + " PRIMARY KEY NOT NULL,\n"
                );
              } else if (builtinAttribute.indexOf("Required") > -1) {
                element = removeEfBuiltinAttribute(element);
                scriptArray.push(replaceEfType(element) + " NOT NULL,\n");
              } else {
                scriptArray.push("  " + replaceEfType(element) + " NULL,\n");
              }
            } else {
              tempBuiltinAttribute = element;
            }
          }
        }
      }
    }
  });
  // Remove Last Comma.
  scriptArray[scriptArray.length - 1] = scriptArray[
    scriptArray.length - 1
  ].replace(",", "");
  scriptArray.push(")");
  saveScript(scriptArray, ".sql");
}

// SqlScript to Convert Ef Model Class
function convertEfCoreModel(lineArray: string[]) {
  let intentString: string = "    ";
  let scriptArray: string[] = [];
  let tokenArray: string[] = lineArray;

  scriptArray.push("using System;" + "\n");
  scriptArray.push("using System.ComponentModel.DataAnnotations;" + "\n\n");
  scriptArray.push("namespace efcore_namespace" + "\n");
  scriptArray.push("{");
  scriptArray.push("\n");

  tokenArray.forEach((element) => {
    // Replace Table Name to Class Name
    if (element.toUpperCase().indexOf("CREATE TABLE") > -1) {
      element = removeSqlString(element);

      element = element.replace("(", "");
      element = element.replace(")", "");
      element = element.replace("[", "");
      element = element.replace("]", "");
      element = element.replace(",", "");

      if (element.indexOf(".") > -1) {
        element = element.split(".")[1];
        scriptArray.push(" public class " + element + "\n {\n");
      }
    } else {
      if (
        element.indexOf(",") > -1 &&
        (element.toUpperCase().indexOf("NULL") > -1 ||
          element.toUpperCase().indexOf("NOT NULL") > -1)
      ) {
        element = removeSqlString(element);

        if (element.toUpperCase().indexOf("NOT NULL") > -1) {
          element = replaceSqlType(element);

          element = element.replace("NOT NULL", "");
          element = element.replace("IDENTITY", "");
          element = element.replace(",", "");
          element = element.replace("[", "");
          element = element.replace("]", "");

          // Insert BuiltinAttribute [Key] Or [Required]
          if (element.toUpperCase().indexOf("PRIMARY KEY") > -1) {
            element = element.replace("PRIMARY KEY", "");
            scriptArray.push(intentString + "[Key]");
          } else {
            scriptArray.push(intentString + "[Required]");
          }

          // Make Property
          scriptArray.push("public " + element + "{ get; set; }\n");
        } else {
          element = replaceSqlType(element);

          element = element.replace("NULL", "");
          element = element.replace(",", "");
          element = element.replace("[", "");
          element = element.replace("]", "");

          // Make Property
          scriptArray.push(
            intentString + "public " + element + "{ get; set; }\n"
          );
        }
      }
    }
  });
  scriptArray.push("}\n");

  // Create Ef Core Model
  saveScript(scriptArray, ".cs");
}

// Get CSharpe(EF Model) BuiltinAttribute. ex: [Key], [Required]
function getBuiltinAttribute(scriptText: string): string {
  let returnText: string = scriptText;
  returnText = returnText.substring(
    returnText.indexOf("["),
    returnText.indexOf("]") + 1
  );
  return returnText;
}

function removeSqlString(scriptText: string): string {
  let returnText: string = scriptText.trim();

  returnText = returnText.replace(",", "");
  returnText = returnText.replace("\r", "");
  returnText = returnText.replace("[", "");
  returnText = returnText.replace("]", "");

  return returnText;
}

function removeEfString(scriptText: string): string {
  let returnText: string = scriptText.trim();

  returnText = returnText.replace("{ get; set; }", "");
  returnText = returnText.replace("\r", "");
  returnText = returnText.replace("\n", "");
  returnText = returnText.replace("{", "");
  returnText = returnText.replace("}", "");
  returnText = returnText.replace(";", "");

  return returnText;
}

// Remove C Sharpe(EF Model) BuiltinAttribute. ex: [Key], [Required]
function removeEfBuiltinAttribute(scriptText: string): string {
  let returnText: string = scriptText;
  let removeText: string = scriptText;

  removeText = returnText.substring(
    removeText.indexOf("["),
    removeText.indexOf("]") + 1
  );

  returnText = returnText.replace(removeText, "");

  return returnText;
}

// Remove CSharpe Class Keyword
function removeEfKeyword(scriptText: string): string {
  let returnText: string = scriptText;
  returnText = returnText.replace("class", "");

  return returnText;
}

// Remove CSharpe Access Modifier
function removeEfAccessModifier(scriptText: string): string {
  let returnText: string = scriptText;

  returnText = returnText.replace("private", "");
  returnText = returnText.replace("public", "");
  returnText = returnText.replace("internal", "");
  returnText = returnText.replace("protected", "");
  returnText = returnText.replace("protected internal", "");
  returnText = returnText.replace("?", "");

  return returnText;
}

// Replace Type Sql to 'CSharpe'
function replaceSqlType(scriptText: string): string {
  let returnText: string = scriptText;
  let returnType: string = "";
  let returnField: string = "";

  if (returnText.indexOf("(") > -1) {
    returnText = returnText.replace(
      returnText.substring(
        returnText.indexOf("("),
        returnText.indexOf(")") + 1
      ),
      ""
    );
  }

  // Replace Type Sql to 'CSharpe'
  if (returnText.indexOf("nvarchar") > -1) {
    returnField = returnText.replace("nvarchar", "");
    returnType = "string ";
    returnText = returnType + returnField;
  } else if (returnText.indexOf("bigint") > -1) {
    returnField = returnText.replace("bigint", "");
    returnType = "long ";
    returnText = returnType + returnField;
  } else if (returnText.indexOf("int") > -1) {
    returnField = returnText.replace("int", "");
    returnType = "int ";
    returnText = returnType + returnField;
  } else if (returnText.indexOf("float") > -1) {
    returnField = returnText.replace("float", "");
    returnType = "float ";
    returnText = returnType + returnField;
  } else if (returnText.indexOf("datetime2") > -1) {
    returnField = returnText.replace("datetime2", "");
    returnType = "DateTime ";
    returnText = returnType + returnField;
  } else if (returnText.indexOf("bit") > -1) {
    returnField = returnText.replace("bit", "");
    returnType = "bool ";
    returnText = returnType + returnField;
  } else {
  }

  return returnText;
}

// Replace Type CSharpe to 'Sql'
function replaceEfType(scriptText: string): string {
  let returnText: string = scriptText;
  let returnType: string = "";
  let returnField: string = "";

  if (returnText.indexOf("string") > -1) {
    returnField = returnText.replace("string", " ");
    returnType = "nvarchar(max)";
    returnText = returnField + returnType;
  } else if (returnText.indexOf("int") > -1) {
    returnField = returnText.replace("int", " ");
    returnType = "int";
    returnText = returnField + returnType;
  } else if (returnText.indexOf("float") > -1) {
    returnField = returnText.replace("float", " ");
    returnType = "float";
    returnText = returnField + returnType;
  } else if (returnText.indexOf("long") > -1) {
    returnField = returnText.replace("long", " ");
    returnType = "bigint";
    returnText = returnField + returnType;
  } else if (returnText.indexOf("DateTime") > -1) {
    returnField = returnText.replace("DateTime", " ");
    returnType = "datetime(7)";
    returnText = returnField + returnType;
  } else if (returnText.indexOf("bool") > -1) {
    returnField = returnText.replace("bool", " ");
    returnType = "bit";
    returnText = returnField + returnType;
  } else {
  }

  return returnText;
}

// Save 'Sql' Or 'CSharpe' Script
function saveScript(scriptArray: string[], fileExtension: string) {
  let scriptFilePath: string | undefined =
    vscode.window.activeTextEditor?.document.fileName;

  let scriptText: string = "";

  scriptArray.forEach((element) => {
    scriptText += element;
  });

  if (scriptFilePath !== undefined) {
    vscode.workspace.fs.writeFile(
      vscode.Uri.file(scriptFilePath.toString() + fileExtension),
      new TextEncoder().encode(scriptText)
    );
  }

  vscode.window.showInformationMessage("Save Script!");
}

// this method is called when your extension is deactivated
export function deactivate() {}
