<div class="sidebarSectionHeader">Settings</div>

                <div class="fieldRow">
                    <span class="fieldLabel">Big Step</span>
                    <span class="fieldInput">
                        <input type="text" id="cfgStep">
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">Threshold</span>
                    <span class="fieldInput">
                        <input type="text" id="cfgThreshold">
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">Verbose</span>

                    <span class="fieldInput">
                        <label>
                            <input type="checkbox" id="cfgVerbose">
                            Verbose log
                        </label>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">&nbsp;</span>

                    <span class="fieldInput">
                        <button onclick="applySettings()">Apply</button>
                    </span>
                </div>

                <div class="small" style="margin-top:6px;">
                    App folder:
                    <span id="appPath"></span>
                </div>

                <div class="small" id="statusText">Initializing...</div>

                <div class="sidebarDivider"></div>

                <div class="sidebarSectionHeader">Diagnostics</div>

                <div id="diagPanel">

                    <div class="fieldRow">
                        <span class="fieldLabel">NB ID</span>

                        <span class="fieldInput">
                            <input type="text" id="diagNb" value="0007">
                        </span>
                    </div>

                    <div class="fieldRow">
                        <span class="fieldLabel">GCTS</span>

                        <span class="fieldInput">
                            <input type="text" id="diagVal" value="3952">
                        </span>
                    </div>

                    <div class="fieldRow">
                        <span class="fieldLabel">&nbsp;</span>

                        <span class="fieldInput">
                            <button onclick="runDiagnostic()">Run Diagnostic</button>
                            <button onclick="dumpListHtml()">Dump List HTML</button>
                        </span>
                    </div>

                    <div class="fieldRow">
                        <span class="fieldLabel">URL</span>
                    </div>
                    <div id="diagUrl" class="diagBox"></div>

                    <div class="fieldRow">
                        <span class="fieldLabel">Status</span>
                    </div>
                    <div id="diagStatus" class="diagBox"></div>

                    <div class="fieldRow">
                        <span class="fieldLabel">Result</span>
                    </div>
                    <div id="diagResult" class="diagBox"></div>

                    <div class="fieldRow">
                        <span class="fieldLabel">HTML</span>
                    </div>
                    <div id="diagHtml" class="diagBox"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
=== END OF PART 07/7 — FILE COMPLETE ===
