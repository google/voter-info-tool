/**
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import com.google.template.soy.SoyFileSet;
import com.google.template.soy.data.SoyData;
import com.google.template.soy.data.SoyListData;
import com.google.template.soy.data.SoyMapData;
import com.google.template.soy.jssrc.SoyJsSrcOptions;
import com.google.template.soy.jssrc.SoyJsSrcOptions.CodeStyle;
import com.google.template.soy.shared.SoyGeneralOptions.CssHandlingScheme;
import com.google.template.soy.tofu.SoyTofu;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileFilter;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility to generate HTML from provided templates.
 *
 * @author jmwaura@google.com (Jesse Mwaura)
 *
 * TODO(jmwaura): Clean this up at some point.
 */
public class CompileSoy {
  private static final int MAX_DIR_TRAVERSAL_DEPTH = 6;

  /**
   * Simple argument parser that accepts arguments of the form {@code --name=value} or
   * {@code --name value}. Parses all arguments before the "--" separator into supplied argMap
   * and returns the rest as a SoyMapData object.
   */
  @SuppressWarnings("unchecked")
  private static SoyMapData parseArgs(String[] args, Map<String, String> argMap)
      throws IllegalArgumentException{
    List<Argument> parsedArgs = new ArrayList<Argument>();
    List<Argument> parsedData = new ArrayList<Argument>();
    List<Argument> parsed = parsedArgs;

    for (int i = 0; i < args.length; i++) {
      String arg = args[i];
      if (!arg.startsWith("--")) {
        throw new IllegalArgumentException(arg + " is not a valid argument.");
      }

      // Switch to parsing data after separator.
      if (arg.equals("--")) {
        parsed = parsedData;
        continue;
      }

      String strippedArg = arg.substring(2);
      int separatorIndex = strippedArg.indexOf("=");
      if (separatorIndex < 0) {
        if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
          parsed.add(new Argument(strippedArg, args[++i]));
        } else {
          throw new IllegalArgumentException("You must provide a value for argument " + arg);
        }
      } else if (separatorIndex > 0) {
        String argName = strippedArg.substring(0, separatorIndex);
        String argVal = strippedArg.substring(separatorIndex + 1);
        parsed.add(new Argument(argName, argVal));
      } else {
        throw new IllegalArgumentException(arg + "is not a valid argument");
      }
    }
    for (Argument parsedArg : parsedArgs) {
      argMap.put(parsedArg.name, parsedArg.value);
    }

    return argsToSoyMap(parsedData);
  }

  /**
   * Organize list of Arguments into SoyMapData object.
   */
  private static SoyMapData argsToSoyMap(List<Argument> args) {
    Map<String, String> stringArgs = new HashMap<String, String>();
    Map<String, List<String>> listArgs = new HashMap<String, List<String>>();

    for (Argument arg : args) {
      if (stringArgs.containsKey(arg.name) || arg.name.endsWith("[]")) {
        // We've seen this before or it's explicitly marked as a list.
        String name = (arg.name.endsWith("[]")) ?
            arg.name.substring(0, arg.name.length() - 2) : arg.name;
        List<String> listArg = listArgs.get(name);
        if (listArg == null) {
          listArg = new ArrayList<String>();
          // Move from stringArgs into this list, but leave in stingArgs to avoid
          // having to check both places.
          if (stringArgs.containsKey(name)) {
            listArg.add(stringArgs.get(name));
          }
          listArgs.put(name, listArg);
        }
        listArg.add(arg.value);
      } else {
        stringArgs.put(arg.name, arg.value);
      }
    }

    Map<String, SoyData> soyDataMap = new HashMap<String, SoyData>();
    for (Map.Entry<String, String> entry : stringArgs.entrySet()) {
      soyDataMap.put(entry.getKey(), SoyData.createFromExistingData(entry.getValue()));
    }
    for (Map.Entry<String, List<String>> entry : listArgs.entrySet()) {
      soyDataMap.put(entry.getKey(), new SoyListData(entry.getValue()));
    }
    return new SoyMapData(soyDataMap);
  }

  /**
   * Find all soy files under a given path.
   */
  private static List<File> findSoyFiles(String dirName) {
    FileFilter filter = new FileFilter() {
      @Override
      public boolean accept(File file) {
        if (file.isDirectory() || (file.isFile() && file.getName().endsWith(".soy"))) {
          return true;
        }
        return false;
      }
    };
    File file = new File(dirName);
    return findFiles(file, filter, 0);
  }

  /**
   * Recurse through a directory to find files matching a provided filter.
   */
  private static List<File> findFiles(File dir, FileFilter filter, int depth) {
    List<File> filteredFiles = new ArrayList<File>();
    if (depth > MAX_DIR_TRAVERSAL_DEPTH) {
      return filteredFiles;
    }
    if (dir.isDirectory()) {
      File[] files = dir.listFiles(filter);
      for (File file : files) {
        if (file.isDirectory()) {
          filteredFiles.addAll(findFiles(file, filter, depth + 1));
        } else {
          filteredFiles.add(file);
        }
      }
    } else {
      if (filter.accept(dir)) {
        filteredFiles.add(dir);
      }
    }
    return filteredFiles;
  }

  /**
   * Render a template given the files and params.
   */
  private static String renderHTML(String template, SoyFileSet files, SoyMapData params) {
    SoyTofu tofu = files.compileToTofu();
    return tofu.newRenderer(template).setData(params).render();
  }

  /**
   * Compile soy files to JS source.
   */
  private static void compileToJs(SoyFileSet fileSet, List<File> inputFiles, String outputFilePath)
      throws Exception {
    SoyJsSrcOptions jsSrcOptions = new SoyJsSrcOptions();
    jsSrcOptions.setCodeStyle(CodeStyle.STRINGBUILDER);
    jsSrcOptions.setShouldGenerateJsdoc(true);

    // This option is not available on the commandline, but allows use of the
    // same namespace in multiple files.
    jsSrcOptions.setShouldProvideRequireJsFunctions(true);

    // Let the closure compiler handle i18n
    jsSrcOptions.setShouldGenerateGoogMsgDefs(true);
    jsSrcOptions.setUseGoogIsRtlForBidiGlobalDir(true);

    List<String> jsSources = fileSet.compileToJsSrc(jsSrcOptions, null);
    for (int i = 0; i < jsSources.size(); i++) {
      File outFile = new File(outputFilePath, inputFiles.get(i).getName() + ".js");
      BufferedWriter out = null;
      try {
        out = new BufferedWriter(new FileWriter(outFile));
        out.write(jsSources.get(i));
      } finally {
        if (out != null) {
          out.close();
        }
      }
    }
  }

  /**
   * Main methods that parses args and runs the soy compiler.
   * Method expects the following args:
   *   {@code --soyFiles} The root directory from which to find Soy template files.
   *   {@code --outputType} The type of outpt to produce. Can be "js" or "html".
   *   {@code --template} The name of the template to be rendered as HTML to stdout.
   *           Only applicable for "html" output.
   *   {@code --soyJsOutputPath} Path to which to write the javascript from soy templates.
   *           Only applicable for "js" output.
   *   {@code --} Separator used to distinguish between arguments to this tool and
   *           SoyMapData. All remaining arguments are parsed into a SoyMapData object for use
   *           in compiling the template. This is really only applicable to "html" output.
   * SoyMapData arguments are of the following format:
   *   --stringName=value
   *   --listName[]=value1
   *   --listName[]=value2
   * If multiple options with the same name are passed, the values are assumed to be members of a
   * list, but note that if a list is expected by the template and only one value is passed, the
   * argument name must end with "[]" to explicitly identify it as a list member.
   *
   * TODO(jmwaura): Ugh, this hurts my head. Not sure any of this is even necessary,
   *     maybe use JSON if it is?
   */
  public static void main(String[] args) throws Exception {
    Map<String, String> argMap = new HashMap<String, String>();
    SoyMapData dataMap = null;
    try {
      dataMap = parseArgs(args, argMap);
    } catch (IllegalArgumentException e) {
      System.err.println(e);
      return;
    }

    List<File> soyFiles = findSoyFiles(argMap.get("soyFiles"));
    SoyFileSet.Builder sfsBuilder = new SoyFileSet.Builder();
    for (File file : soyFiles) {
      sfsBuilder.add(file);
    }
    sfsBuilder.setCssHandlingScheme(CssHandlingScheme.BACKEND_SPECIFIC);
    SoyFileSet soyFileSet = sfsBuilder.build();

    String outputType = argMap.get("outputType");

    if ("js".equals(outputType)) {
      String soyJsOutputPath = argMap.get("soyJsOutputPath");
      compileToJs(soyFileSet, soyFiles, soyJsOutputPath);
    } else if ("html".equals(outputType)) {
      String template = argMap.get("template");
      System.out.println(renderHTML(template, soyFileSet, dataMap));
    } else {
      throw new Exception("Invalid outputType specified");
    }
  }

  private static class Argument {
    public final String name;
    public final String value;
    public Argument(String name, String value) {
      this.name = name;
      this.value = value;
    }
  }
}
