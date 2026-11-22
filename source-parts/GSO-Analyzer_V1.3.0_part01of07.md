<html>
<head>
    <title>GSO Analyzer Pro</title>

    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=8" />

    <HTA:APPLICATION
        APPLICATIONNAME="GSO Analyzer Pro"
        BORDER="thick"
        BORDERSTYLE="normal"
        CAPTION="yes"
        SHOWINTASKBAR="yes"
        SINGLEINSTANCE="yes"
        SYSMENU="yes"
        WINDOWSTATE="normal"
        SCROLL="yes"
    />

    <style>
        body {
            font-family: Segoe UI, Arial, sans-serif;
            font-size: 15px;
            margin: 0;
            padding: 0;
            background: #eef3f8;
            color: #222;
        }

        .header {
            background: #243447;
            color: #fff;
            padding: 10px;
        }

        .title {
            font-size: 22px;
            font-weight: bold;
        }

        .subtitle {
            font-size: 12px;
            color: #c9d6e3;
            margin-top: 2px;
        }

        .toolbar {
            background: #f7f9fc;
            border-bottom: 1px solid #cfd8e3;
            padding: 8px;
        }

        .toolbar button,
        .editPane button {
            margin-right: 4px;
            margin-bottom: 4px;
            padding: 5px 11px;
            border-radius: 3px;
            border: 1px solid #2b6cb0;
            background: #2b6cb0;
            color: #fff;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
        }

        .toolbar button:hover,
        .editPane button:hover {
            background: #24548a;
            border-color: #24548a;
        }

        .toolbar button:disabled,
        .editPane button:disabled {
            background: #9a9a9a;
            border-color: #9a9a9a;
            color: #ffffff;
            font-weight: bold;
            cursor: default;
        }

        .toolbar input[type=text] {
            padding: 4px 6px;
            border: 1px solid #b8c4d1;
            border-radius: 3px;
            font-size: 13px;
        }

        .section {
            margin: 10px;
            border: 1px solid #cfd8e3;
            background: #fff;
        }
        .sectionHeader {
            background: #e7eef7;
            border-bottom: 1px solid #cfd8e3;
            padding: 6px 8px;
            font-weight: bold;
            font-size: 15px;
        }

        .sectionBody {
            padding: 8px;
            position: relative;
        }

        .mainLayout {
            position: relative;
            min-height: 260px;
        }

        .mainListContainer {
            margin-right: 390px;
            position: relative;
            min-height: 620px;
            height: 620px;
        }

        .tableContainer {
            overflow-y: auto;
            overflow-x: hidden;
            border: 1px solid #cfd8e3;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 230px;
            background: #fff;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 14px;
        }

        th {
            background: #dfe8f2;
            border: 1px solid #cfd8e3;
            padding: 6px 7px;
            text-align: left;
            cursor: pointer;
        }

        td {
            border: 1px solid #e6edf5;
            padding: 4px 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        tr.selected {
            background: #d9ecff;
        }

        tr.updated td {
            color: #0a7a2f;
            font-weight: bold;
        }

        tr.muted td {
            color: #999;
            background: #f7f7f7;
        }

        .searchArea {
            float: right;
            font-weight: normal;
        }

        .searchArea input[type=text] {
            margin-left: 8px;
            padding: 4px 8px;
        }

        .editPane {
            position: absolute;
            top: 0;
            right: 0;
            width: 370px;
            border-left: 1px solid #cfd8e3;
            padding-left: 8px;
            font-size: 13px;
            overflow-y: auto;
            background: #ffffff;
        }

        .fieldRow {
            margin-bottom: 8px;
        }

        .fieldLabel {
            display: inline-block;
            width: 90px;
            font-weight: bold;
            vertical-align: top;
        }

        .fieldInput {
            display: inline-block;
            width: 250px;
        }

        input[type=text],
        input[type=number] {
            width: 200px;
            padding: 4px;
            border: 1px solid #b8c4d1;
            border-radius: 3px;
            font-size: 13px;
        }

        select.statusSelect {
            width: 120px;
            padding: 3px;
            font-size: 12px;
            margin-left: 10px;
            border: 1px solid #b8c4d1;
            border-radius: 3px;
        }

        select.statusSelect:disabled {
            color: #999;
            background: #eee;
        }

        .scopeRow {
            margin-bottom: 4px;
        }

        .scopeRow label {
            font-weight: bold;
        }

        .chip {
            display: inline-block;
            padding: 1px 6px;
            margin: 1px 2px 1px 0;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            color: #fff;
            line-height: 15px;
        }

        .chip.notified { background: #2e7d32; }
        .chip.suspended { background: #f9a825; color: #4a3800; }
        .chip.withdrawn { background: #c62828; }
        .chip.expired { background: #9e9e9e; }
        .chip.none { background: #cfd8e3; color: #666; }

        .small {
            font-size: 12px;
            color: #666;
        }

        .sidebarSectionHeader {
            margin: 10px 0 6px 0;
            font-weight: bold;
            font-size: 13px;
            border-bottom: 2px solid #c0ccda;
            padding-bottom: 3px;
            text-transform: uppercase;
            color: #243447;
        }

        .sidebarDivider {
            border-top: 1px solid #cfd8e3;
            margin: 8px 0;
        }

        #logSection {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            margin-top: 0 !important;
            margin-bottom: 0;
            height: 220px;
            background: #fff;
        }

        #logSection .sectionBody {
            height: 170px;
            box-sizing: border-box;
        }

        .logBox {
            height: 100%;
            overflow: auto;
            background: #111;
            color: #ddd;
            padding: 8px;
            font-family: Consolas, monospace;
            font-size: 13px;
        }

        .timelineInfo {
            margin-bottom: 5px;
        }

        .timelineContainer {
            border: 1px solid #cfd8e3;
            max-height: 210px;
            overflow-y: auto;
            overflow-x: hidden;
            background: #fff;
        }

        .timelineTable {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 12px;
        }

        .timelineTable th {
            background: #dfe8f2;
            border: 1px solid #cfd8e3;
            padding: 4px 5px;
            text-align: left;
            cursor: default;
        }

        .timelineTable td {
            border: 1px solid #e6edf5;
            padding: 4px 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .timelineEmpty {
            color: #666;
            font-style: italic;
        }

        .timelineDifferencePositive {
            color: #0a7a2f;
            font-weight: bold;
        }

        .timelineDifferenceNegative {
            color: #b42318;
            font-weight: bold;
        }

        .timelineDifferenceNeutral {
            color: #666;
        }

        .diagBox {
            background: #f7f7f7;
            border: 1px solid #ddd;
            padding: 6px;
            font-family: Consolas, monospace;
            font-size: 11px;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 160px;
            overflow: auto;
        }

        .ok { color: #4cd964; }
        .err { color: #ff6b6b; }
        .warn { color: #ffd166; }
        .info { color: #7dcfff; }

        .hidden {
            display: none;
        }
    </style>

    <script language="javascript">
        var fso = null;
        var appFolder = "";
        var dataFile = "";
        var configFile = "";

        var appVersion = "V1.3.0";

        var REG_LIST_URL = "https://www.gso.org.sa/nb/notified-body-list";

        var SCOPE_KEYS = ["toys", "lv", "wer", "sc", "ga", "mslv"];
        var SCOPE_LABELS = { toys: "TOYS", lv: "LV", wer: "WER", sc: "MS-SC", ga: "MS-GA", mslv: "MS-LV" };

        var STATUS_ORDER = ["notified", "suspended", "withdrawn", "expired"];
        var STATUS_LABELS = { notified: "Notified", suspended: "Suspended", withdrawn: "Withdrawn", expired: "Expired" };

        var REG_SCOPE_MAP = [
            { label: "Children Toys", key: "toys" },
            { label: "Water Conservation", key: "wer" },
            { label: "Electrical Appliances - MS", key: "mslv" },
            { label: "Electrical Appliances", key: "lv" },
            { label: "Gas Appliances", key: "ga" },
            { label: "Scooters", key: "sc" }
        ];

        var STATUS_WORDS = {
            "NOTIFIED": "notified",
            "SUSPENDED": "suspended",
            "WITHDRAWN": "withdrawn",
            "EXPIRED": "expired"
        };

        var COUNTRY_FULL_TO_ISO = {
            "SAUDI ARABIA": "SA",
            "UNITED ARAB EMIRATES": "AE",
            "HONG KONG": "HK",
            "CHINA": "CN",
            "REPUBLIC OF KOREA": "KR",
            "EGYPT": "EG",
            "BELGIUM": "BE",
            "BRAZIL": "BR",
            "GERMANY": "DE",
            "DENMARK": "DK",
            "SPAIN": "ES",
            "FRANCE": "FR",
            "UNITED KINGDOM": "GB",
            "ITALY": "IT",
            "JAPAN": "JP",
            "MEXICO": "MX",
            "MALAYSIA": "MY",
            "NETHERLANDS": "NL",
            "NORWAY": "NO",
            "SINGAPORE": "SG",
            "SWEDEN": "SE",
            "THAILAND": "TH",
            "TURKEY": "TR",
            "UNITED STATES": "US"
        };

        var GROUP_DICT = {
            "BUREAU VERITAS": "BV",
            "LCIE": "BV",
            "TUV RHEINLAND": "TUVRH",
            "T\u00DCV RHEINLAND": "TUVRH",
            "TUV SUD": "TUV-SUD",
            "T\u00DCV S\u00DCD": "TUV-SUD",
            "TUV AUSTRIA": "TUVAT",
            "T\u00DCV AUSTRIA": "TUVAT",
            "TUVAUSTRIA": "TUVAT",
            "T U V S W": "TUVSW",
            "TUVSW": "TUVSW",
            "INTERTEK": "Intertek",
            "COTECNA": "COTECNA",
            "EUROFINS": "EF",
            "IMQ": "IMQ",
            "NEMKO": "NEMKO",
            "DEKRA": "DEKRA",
            "KOREA TESTING ********ION": "KTC",
            "KOREA TESTING LABORATORY": "KTL",
            "KOREA TESTING": "KTR",
            "SIRIM": "SIRIM",
            "MOIAT": "MOIAT",
            "SASO": "SASO",
            "SAITCO": "SAITCO",
            "MOTABAQAH": "MOTABAQAH",
            "APAVE": "APAVE",
            "BSI": "BSI",
            "VDE": "VDE",
            "AENOR": "AENOR",
            "QIMA": "QIMA",
            "UL VS": "UL",
            "UL LLC": "UL",
            "UL INTERNATIONAL": "UL",
            "TSE": "TSE",
            "SGS-CSTC": "SGS",
            "SGS": "SGS"
        };

        var CITY_ABBREV = {
            "GUANGZHOU": "GZ",
            "SHANGHAI": "SH",
            "SHENZHEN": "SZ",
            "BEIJING": "BJ",
            "HANGZHOU": "HZ",
            "FOSHAN": "FS",
            "XIAMEN": "XM",
            "SUZHOU": "SU"
        };

        var NBs = {};
        var config = {
            step: 2000,
            threshold: 1,
            verbose: true,
            cleanupDone: false
        };

        var groupKeysSorted = [];

        var selectedId = "";
        var updatedThisSession = {};
        var sortKey = "id";
        var sortAsc = true;

        var isScanning = false;
        var shouldStop = false;
        var scanIds = [];
        var scanIndex = 0;
        var currentScan = null;

        var isSyncing = false;
        var syncState = null;

        var LOG_MAX_LINES = 500;

        function init() {
            try {
                fso = new ActiveXObject("Scripting.FileSystemObject");
                appFolder = getAppFolder();
                dataFile = appFolder + "\\data.json";
                configFile = appFolder + "\\config.json";

                applyVersion();
                setText("appPath", appFolder);

                buildGroupKeys();
                loadConfig();
                loadData();
                maybeRunDataCleanup();
                attachEditorHandlers();
                renderTable();

                updateStatus("Ready");
                log("Application initialized.", "ok");

                updateLayout();
                window.onresize = updateLayout;

                setTimeout(function() { startSync(false); }, 800);
            } catch (e) {
                alert("Initialization failed: " + e.message);
            }
        }

        function buildGroupKeys() {
            groupKeysSorted = [];
            for (var k in GROUP_DICT) {
                if (GROUP_DICT.hasOwnProperty(k)) {
                    groupKeysSorted.push(k);
                }
            }
            groupKeysSorted.sort(function(a, b) {
                return b.length - a.length;
            });
        }

        function applyVersion() {
            setText("appTitle", "GSO Analyzer Pro " + appVersion);
            setText(
                "appSubtitle",
                "HTA simplified edition | Direct GSO access | Register sync | Per-scope status | " + appVersion
            );

            try {
                document.title = "GSO Analyzer Pro " + appVersion;
            } catch (e) {
            }
        }

        function getAppFolder() {
            var path = unescape(window.location.pathname);
            path = path.replace(/\//g, "\\");

            if (path.charAt(0) === "\\") {
                path = path.substr(1);
            }

            return path.substring(0, path.lastIndexOf("\\"));
        }

        function setText(id, txt) {
            document.getElementById(id).innerText = txt;
        }

        function log(msg, cls) {
            var out = document.getElementById("logOutput");
            var div = document.createElement("div");

            div.className = cls || "";
            div.innerText = "[" + timeStamp() + "] " + msg;

            out.appendChild(div);

            while (out.childNodes.length > LOG_MAX_LINES) {
                out.removeChild(out.firstChild);
            }

            out.scrollTop = out.scrollHeight;
        }

        function clearLog() {
            document.getElementById("logOutput").innerHTML = "";
        }

        function timeStamp() {
            var d = new Date();
            return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
        }

        function pad(n) {
            return (n < 10 ? "0" : "") + n;
        }

        function updateStatus(msg) {
            setText("statusText", msg + " | Last UI update: " + new Date().toLocaleTimeString());
        }

        function fileExists(path) {
            return fso.FileExists(path);
        }

        function readTextFile(path) {
            var stream = new ActiveXObject("ADODB.Stream");

            stream.Type = 2;
            stream.Charset = "utf-8";
            stream.Open();
            stream.LoadFromFile(path);

            var txt = stream.ReadText(-1);

            stream.Close();

            return txt;
        }

        function backupFile(path) {
            try {
                fso.CopyFile(path, path + ".bak", true);
            } catch (e) {
            }
        }

        function backupDatedDataFile() {
            try {
                if (fileExists(dataFile)) {
                    fso.CopyFile(dataFile, dataFile + ".bak-" + getDateStamp() + "-" + pad(new Date().getHours()) + pad(new Date().getMinutes()) + pad(new Date().getSeconds()), true);
                }
            } catch (e) {
                log("Dated backup failed: " + e.message, "warn");
            }
        }

        function writeTextFile(path, content) {
            var tmp = path + ".tmp";
            var stream = new ActiveXObject("ADODB.Stream");

            stream.Type = 2;
=== END OF PART 01 — CONTINUES IN NEXT PART (this marker MUST be the last line of this chunk) ===