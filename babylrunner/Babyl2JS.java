import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.util.Locale;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.babylscript.CustomTokenizerConfig;
import org.mozilla.javascript.babylscript.TranslatedNameBindings;
import org.mozilla.javascript.babylscript.gen.Cvnss40;


/**
 * BilaScript CVNSS4.0 -> JavaScript translator.
 *
 * The original Babyl2JS compiler is retained, but BilaScript registers the
 * CVNSS4.0 keyword/object table in Babylscript's custom-language channel.
 * CustomTokenizer extends BabylGenericTokenizer, so the source still travels
 * through Babylscript's multilingual token pipeline rather than through a
 * text-only search/replace pass.
 */
public class Babyl2JS
{
    public Babyl2JS()
    {
        registerCvnssTranslations();
    }

    private static CustomTokenizerConfig createCvnssTokenizerConfig()
    {
        CustomTokenizerConfig config = new CustomTokenizerConfig();
        config.keywords.putAll(Cvnss40.keywordMap());
        return config;
    }

    /**
     * ParserToJS builds its JavaScript runtime header from
     * TranslatedNameBindings.langResourceMap. Registering CVNSS4.0 here before
     * the first compile allows generated JavaScript to resolve aliases such as
     * Magz -> Array, Wayl -> Date and mony_Tolj -> Math.
     */
    private static void registerCvnssTranslations()
    {
        TranslatedNameBindings.keywordResourceMap.put("bila", Cvnss40.keywordMap());
        TranslatedNameBindings.langResourceMap.put("bila", Cvnss40.objectMap());
    }

    private static String normalizeCvnssDirectives(String code)
    {
        if (code == null) return "";

        return code
            .replaceAll("(?m)^(\\s*)---cvss---(\\s*)$", "$1---bila---$2")
            .replaceAll("(?m)^(\\s*)---cvnss---(\\s*)$", "$1---bila---$2")
            .replaceAll("(?m)^(\\s*)---cvnss40---(\\s*)$", "$1---bila---$2")
            .replaceAll("(?m)^(\\s*)---cvnss4---(\\s*)$", "$1---bila---$2");
    }

    public String translateCode(String code, String filename, boolean useHeaders)
    {
        registerCvnssTranslations();

        Context cx = Context.enter();
        cx.setLocale(Locale.ENGLISH);
        cx.setOptimizationLevel(-1);
        String result = "";
        try {
            String source = normalizeCvnssDirectives(code);
            result = cx.compileStringToJS(source, filename, 0, useHeaders);
        } finally {
            Context.exit();
        }
        return result;
    }

    public void translateFile(String inFile, String outFile, boolean useHeaders, boolean useHTML) throws IOException
    {
        FileInputStream f = new FileInputStream(inFile);
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

        String js = translateCode(str.toString(), inFile, useHeaders);

        if (useHTML)
        {
            js = "<!DOCTYPE html>"
                    + "<head>"
                    + "<META http-equiv=\"Content-Type\" content=\"text/html;\" charset=\"UTF-8\">"
                    + "</head>"
                    + "<script>" + js + "</script>";
        }

        FileOutputStream outStream = new FileOutputStream(outFile);
        OutputStreamWriter out = new OutputStreamWriter(outStream, "UTF-8");
        out.write(js);
        out.close();
        outStream.close();
    }

    static void outputMessage()
    {
        System.out.println(
                "   java -jar babyl2js.jar [-noheaders] [-html] input-BilaScript-file output-JS-file\n" +
                "Chuyen BilaScript/Babylscript CVNSS4.0 thanh JavaScript thong thuong.\n" +
                "Tep dau vao phai o UTF-8. Dung ---bila--- cho BilaScript CVNSS4.0.\n" +
                "-noheaders: khong chen Babylscript runtime header.\n" +
                "-html: boc JavaScript dau ra trong mot tep HTML co the mo truc tiep.\n");
    }

    public static void main(String[] args) throws IOException
    {
        boolean noHeaders = false;
        boolean useHTML = false;
        String inFile = null;
        String outFile = null;
        for (String arg: args)
        {
            if (arg.equals("-noheaders"))
                noHeaders = true;
            else if (arg.equals("-html"))
                useHTML = true;
            else if (inFile == null)
                inFile = arg;
            else if (outFile == null)
                outFile = arg;
            else
            {
                outputMessage();
                return;
            }
        }

        if (outFile == null)
        {
            outputMessage();
            return;
        }

        Babyl2JS translator = new Babyl2JS();
        translator.translateFile(inFile, outFile, !noHeaders, useHTML);
    }
}
