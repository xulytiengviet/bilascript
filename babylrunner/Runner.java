import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.Locale;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptableObject;


/**
 * BilaScript runner.
 *
 * BilaScript v2.0 exposes ---bila---, ---bila:strict--- and ---bila:js--- profiles.
 * Legacy ---cvss---/---cvnss--- directives remain accepted as compatibility
 * aliases and normalize to the same native LanguageMode.bila.
 *
 * CustomTokenizer extends BabylGenericTokenizer, so CVNSS4.0 keywords are
 * tokenized through the same multilingual keyword mechanism as Babylscript.
 */
public class Runner
{
    ScriptableObject scope;

    public Runner()
    {
        Context cx = Context.enter();
        cx.setLocale(Locale.ENGLISH);
        cx.setOptimizationLevel(-1);
        try {
            scope = cx.initStandardObjects();

            // Keep the original console alert helper, then attach CVNSS4.0
            // aliases to the initialized standard/global objects.
            cx.evaluateString(
                scope,
                "function alert(text) { java.lang.System.out.println(text); } "
                + "this['fr':'alerter'] = this['ar':'\\u062a\\u062d\\u0630\\u064a\\u0631'] = 'alert';",
                null,
                0,
                null
            );
        } finally {
            Context.exit();
        }
    }

    private static String normalizeCvnssDirectives(String code)
    {
        if (code == null) return "";

        // Legacy aliases -> native BilaScript language mode.
        return code
            .replaceAll("(?m)^(\\s*)---cvss---(\\s*)$", "$1---bila---$2")
            .replaceAll("(?m)^(\\s*)---cvnss---(\\s*)$", "$1---bila---$2")
            .replaceAll("(?m)^(\\s*)---cvnss40---(\\s*)$", "$1---bila---$2")
            .replaceAll("(?m)^(\\s*)---cvnss4---(\\s*)$", "$1---bila---$2");
    }

    public String runCode(String code, String filename)
    {
        Context cx = Context.enter();
        cx.setOptimizationLevel(-1);
        try {
            String source = normalizeCvnssDirectives(code);
            return Context.toString(cx.evaluateString(scope, source, filename, 0, null));
        } finally {
            Context.exit();
        }
    }

    public void runFile(String filename) throws IOException
    {
        FileInputStream f = new FileInputStream(filename);
        InputStreamReader reader = new InputStreamReader(f, "UTF-8");

        StringWriter str = new StringWriter();
        char [] buf = new char[1024];
        int numRead = reader.read(buf);
        while (numRead >= 0)
        {
            str.write(buf, 0, numRead);
            numRead = reader.read(buf);
        }

        reader.close();
        f.close();

        runCode(str.toString(), filename);
    }

    public static void main(String[] args) throws IOException
    {
        if (args.length < 1)
        {
            System.out.println(
                "BilaScript - JavaScript/ECMAScript voi bo tu khoa CVNSS4.0\n"
                + "Cach dung: java -jar build/babylscriptrun.jar <tep1> [tep2 ...]\n"
                + "Tep nguon phai duoc luu o UTF-8.\n"
                + "Profiles: ---bila--- (mac dinh), ---bila:strict--- (CVNSS canonical), ---bila:js--- (migration).\n"
            );
            return;
        }

        Runner runner = new Runner();
        for (String filename: args)
            runner.runFile(filename);
    }
}
