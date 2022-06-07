//******************************************* Global Variables *******************************//

var logicalName; //İşlem yapılacak varlık adı. Parametre olarak alınır web kaynağından alınır
var entityCode;  //İşlem yapılacak varlık objecttypecode. Parametre olarak alınır web kaynağından alınır
var fetchXmlFieldName; //Seçilen görünümün fetchxml sorgusunun yazılacağı alan adı. Parametre olarak alınır web kaynağından alınır
var viewIdFieldName;   //Seçilen görünümün Id bilgisinin yazılacağı alan adı. Parametre olarak alınır web kaynağından alınır
var viewNameFieldName; //Seçilen görünümün Ad bilgininin yazılacağı alan adı. Parametre olarak alınır web kaynağından alınır

var viewList = new Array(); //Varlık için sorgulanan görünümlerin listesini tutar

var selectFetchXmlViewMessagesName = "new_/resx/selectfetchxmlviewmessages"; // Multiple Language için kullanılan crm webresource resx dosyası

$(document).ready(function () {

    loading(false);
    setQuerystringData();

    if (!checkParameters()) {
        return;
    }

    loadSetLabelText();
    backSpacesSolution();
    setEvents();
    getViewList();
});

//******************************************* Functions ***********************************//

function getViewList() {

    loading(true);

    Globals.Crm.API.RetrieveMultiple("savedqueries",
        "$select=name,fetchxml&$filter=returnedtypecode eq '" + logicalName + "' and querytype eq 0 and statecode eq 0",
        true,
        function (result) {

            if (result.isSuccess) {

                if (result.data.length > 0) {

                    var groupObject = new Object();
                    groupObject.text = GetResxValue("SystemViews");
                    groupObject.children = new Array();

                    var nullTtemObject = new Object();
                    nullTtemObject.id = "";
                    nullTtemObject.text = GetResxValue("Choose");
                    groupObject.children.push(nullTtemObject);

                    for (var i = 0; i < result.data.length; i++) {
                        var itemObject = new Object();
                        itemObject.id = result.data[i].savedqueryid;
                        itemObject.text = result.data[i].name;
                        itemObject.fetchxml = result.data[i].fetchxml;
                        itemObject.iscustom = false;
                        groupObject.children.push(itemObject);
                    }

                    viewList.push(groupObject);
                }

                Globals.Crm.API.RetrieveMultiple("userqueries",
                    "$select=name,fetchxml&$filter=returnedtypecode eq '" + logicalName + "'",
                    true,
                    function (result) {

                        if (result.isSuccess) {

                            if (result.data.length > 0) {

                                var groupObject = new Object();
                                groupObject.text = GetResxValue("UserViews");
                                groupObject.children = new Array();

                                for (var i = 0; i < result.data.length; i++) {
                                    var itemObject = new Object();
                                    itemObject.id = result.data[i].userqueryid;
                                    itemObject.text = result.data[i].name;
                                    itemObject.fetchxml = result.data[i].fetchxml;
                                    itemObject.iscustom = true;
                                    groupObject.children.push(itemObject);
                                }

                                viewList.push(groupObject);
                            }

                            setView();
                        }
                    },
                    function (complate) {
                        loading(false);
                        console.log(complate);
                    },
                    function (error) {
                        loading(false);
                        console.log(error);
                    });
            }
        },
        function (complate) {
            loading(false);
            console.log(complate);
        },
        function (error) {
            loading(false);
            console.log(error);
        });
};

function getFetchXml(viewId) {
    for (var i = 0; i < viewList.length; i++) {

        for (var j = 0; j < viewList[i].children.length; j++) {

            if (viewList[i].children[j].id == viewId) {
                return viewList[i].children[j].fetchxml;
            }
        }
    }
};

function getFetchXmlName(viewId) {
    for (var i = 0; i < viewList.length; i++) {

        for (var j = 0; j < viewList[i].children.length; j++) {

            if (viewList[i].children[j].id == viewId) {
                return viewList[i].children[j].text;
            }
        }
    }
};

function setSelectedViewList(viewId) {
    for (var i = 0; i < viewList.length; i++) {

        for (var j = 0; j < viewList[i].children.length; j++) {

            if (viewList[i].children[j].id == viewId) {
                viewList[i].children[j].selected = true;
            }
        }
    }
};

function exist(viewId) {
    for (var i = 0; i < viewList.length; i++) {

        for (var j = 0; j < viewList[i].children.length; j++) {

            if (viewList[i].children[j].id === viewId) {
                return true;
            }
        }
    }
    return false;
};

function setView() {

    var viewId = crmGetValue(viewIdFieldName);

    bindSelectView(viewId);

    setAlertDiv(viewId);
}

function setAlertDiv(viewId) {

    var fetchXml = crmGetValue(fetchXmlFieldName);

    if (!viewId) {
        setMessage("alert alert-danger", "<span class='glyphicon glyphicon-remove-circle'></span> " + GetResxValue("NoViewSelected"));
        return;
    }

    if (exist(viewId)) {

        var isCustom = getIsCustom(viewId);

        getViewUrl(viewId, isCustom,

            function (advanceFindViewUrl) {

                var advanceFindViewUrlButton = "<a class='btn btn-default btn-sm' role='button' target='_blank' href='" + advanceFindViewUrl + "'><span class='glyphicon glyphicon-filter'></span></a>"

                if (fetchXml === getFetchXml(viewId)) {
                    setMessage("alert alert-success", "<span class='glyphicon glyphicon-ok-circle'></span> " + GetResxValue("ViewAndQueryMatched") + " " + advanceFindViewUrlButton);
                }
                else {
                    setMessage("alert alert-warning", "<span class='glyphicon glyphicon-exclamation-sign'></span> " + GetResxValue("ViewAndQueryAreDifferentToUpdate") + " " + "<button class='btn btn-default btn-sm' onclick='btnRefreshFetchXmlOnClick()'><span class='glyphicon glyphicon-refresh'></span> " + GetResxValue("Here") + "</button>" + GetResxValue("Click") + ". " + advanceFindViewUrlButton);
                }
            }

        );

    }
    else {
        setMessage("alert alert-warning", "<span class='glyphicon glyphicon-exclamation-sign'></span> " + GetResxValue("ViewNotFound"));
    }
}

function getIsCustom(viewId) {
    for (var i = 0; i < viewList.length; i++) {

        for (var j = 0; j < viewList[i].children.length; j++) {

            if (viewList[i].children[j].id == viewId) {
                return viewList[i].children[j].iscustom;
            }
        }
    }
};

function bindSelectView(viewId) {

    setSelectedViewList(viewId);

    $("#selectView").select2({
        data: viewList
    });
}

function setMessage(cssClass, message) {

    $("#viewmessage").removeClass("alert alert-success");
    $("#viewmessage").removeClass("alert alert-warning");
    $("#viewmessage").removeClass("alert alert-danger");

    $("#viewmessage").addClass(cssClass);
    $("#viewmessage").html(message);
}

function crmGetValue(feildName) {

    if (parent.frames[0].Xrm.Page.getAttribute(feildName)) {
        return parent.frames[0].Xrm.Page.getAttribute(feildName).getValue(feildName);
    }
    else if (Xrm.Page.getAttribute(feildName)) {
        return Xrm.Page.getAttribute(feildName).getValue(feildName);
    }
    else if (parent.Xrm && parent.Xrm.Page.getAttribute(feildName)) {
        return parent.Xrm.Page.getAttribute(feildName).getValue(feildName);
    }
    else {
        alert(feildName + " " + GetResxValue("FieldNotFoundInForm"));
    }
}

function crmSetValue(feildName, value) {

    if (parent.frames[0].Xrm.Page.getAttribute(feildName)) {
        parent.frames[0].Xrm.Page.getAttribute(feildName).setValue(value);
    }
    else if (Xrm.Page.getAttribute(feildName)) {
        Xrm.Page.getAttribute(feildName).setValue(value);
    }
    else if (parent.Xrm && parent.Xrm.Page.getAttribute(feildName)) {
        parent.Xrm.Page.getAttribute(feildName).setValue(value);
    }
    else {
        alert(feildName + " " + GetResxValue("FieldNotFoundInForm"));
    }
}

function getViewUrl(viewId, isCustom, callBack) {

    var viewTypeCode;

    if (isCustom) { // UserView
        viewTypeCode = 4230;
    }
    else if (!isCustom) { // SystemView
        viewTypeCode = 1039;
    }
    else {
        alert(GetResxValue("ViewTypeNotFound") + "! " + GetResxValue("Error") + " : ViewTypeCode!");
    }

    var globalContext = Xrm.Utility.getGlobalContext();

    globalContext.getCurrentAppProperties().then(
        function success(app) {

            var url = Xrm.Page.context.getClientUrl() + "/main.aspx?appid={" + app.appId + "}&pagetype=advancedfind&extraqs=?EntityCode=" + entityCode + "%26QueryId={" + viewId + "}%26ViewType=" + viewTypeCode;

            callBack(url);

        }, function errorCallback() {

            console.log("appid not exist!");
        });


}

function loadSetLabelText() {
    $("#lblviewId").text(GetResxValue("View"));
}

//******************************************* Events *************************************//

function setEvents() {

    $("#selectView").change(function () {
        selectViewOnchange(this);
    });

    $("#btnRefreshFetchXml").click(function () {

        btnRefreshFetchXmlOnClick();
    });
};

function selectViewOnchange(selected) {

    crmSetValue(viewIdFieldName, selected.value);
    crmSetValue(fetchXmlFieldName, getFetchXml(selected.value));

    if (selected.value)
        crmSetValue(viewNameFieldName, getFetchXmlName(selected.value));
    else
        crmSetValue(viewNameFieldName, null);

    setAlertDiv(selected.value);
};

function btnRefreshFetchXmlOnClick() {

    var viewId = crmGetValue(viewIdFieldName);
    crmSetValue(fetchXmlFieldName, getFetchXml(viewId));
    setAlertDiv(viewId);
};

//************************************* Set CRM Parameters *******************************//

function checkParameters() {

    if (!logicalName || !fetchXmlFieldName || !viewIdFieldName || !entityCode || !viewNameFieldName) {
        setMessage("alert alert-danger", "<span class='glyphicon glyphicon-remove-circle'></span>" + GetResxValue("MissingParameter") + " ! (logicalname,entityCode,fetchxmlfieldname,viewidfieldname,viewNameFieldName)");
        return false;
    }
    return true;
}

function setQuerystringData() {

    var queryString = location.search.substring(1);
    var params = {};
    var queryStringParts = queryString.split("&");
    for (var i = 0; i < queryStringParts.length; i++) {
        var pieces = queryStringParts[i].split("=");
        params[pieces[0]] = pieces.length == 1 ? null : decodeURIComponent(pieces[1]);
    }

    if (params.data) {
        var data = parseDataParameters(params.data);
        logicalName = data.logicalname;
        fetchXmlFieldName = data.fetchxmlfieldname;
        viewIdFieldName = data.viewidfieldname;
        entityCode = data.entitycode;
        viewNameFieldName = data.viewnamefieldname;
    }
};

function parseDataParameters(data) {
    var result = {};

    if (data != null) {
        var values = decodeURIComponent(data).split("&");

        for (var i = 0; i < values.length; i++) {
            var item = values[i].replace(/\+/g, " ").split("=");
            result[item[0]] = item[1];
        }
    }

    return result;
};

function getQueryString(field, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
    var string = reg.exec(href);
    return string ? string[1] : null;
};

//************************************* Solutions ****************************************//

function backSpacesSolution() {
    if (window.Sys && window.Sys.UI && window.Sys.UI.DomEvent && window.Sys.UI.DomEvent.prototype) {
        window.Sys.UI.DomEvent.prototype.preventDefault = function () { };
        window.Sys.UI.DomEvent.prototype.stopPropagation = function () { };
    }
};

function loading(value) {
    if (value) {
        $(".loading").css("display", "block");
    }
    else {
        $(".loading").css("display", "none");
    }
};

//************************************* Helper Functions ********************************//

function GetResxValue(name) {

    return Xrm.Utility.getResourceString(selectFetchXmlViewMessagesName, name);
}

//**************************************** Globals.Crm.API *******************************//

if (typeof (Globals) == "undefined") { Globals = { __namespace: true }; }
if (typeof (Globals.Crm) == "undefined") { Globals.Crm = { __namespace: true }; }

Globals.Crm.API = {

    _methodType: {
        Get: "GET",
        Post: "POST",
        Patch: "PATCH",
        Delete: "DELETE"
    },
    _setRequestHeaders: function (req) {
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    },
    _getDefaultRequestObject: function (type, query, async, successCallBack, errorCallback, orginalSuccesCallback) {
        var req = new XMLHttpRequest();
        req.open(type, query, async);
        this._setRequestHeaders(req);

        req.onreadystatechange = function () {

            if (this.readyState == 4) {
                req.onreadystatechange = null;
                if (this.status == 200 || this.status == 201 || this.status == 204 || this.status == 1223) {
                    successCallBack(this, orginalSuccesCallback);
                }
                else {
                    errorCallback(Globals.Crm.API._errorHandler(this));
                }
            }
        };

        return req;
    },
    _context: function () {
        if (typeof GetGlobalContext != "undefined") { return GetGlobalContext(); }
        else {
            if (typeof Xrm != "undefined") {
                return Xrm.Page.context;
            }
            else { throw new Error("JS context bulunamadı"); }
        }
    },
    _getClientUrl: function () {
        return this._context().getClientUrl();
    },
    _oDataPath: function () {
        return this._getClientUrl() + "/api/data/v9.1/";
    },
    _errorHandler: function (req) {

        console.log("İstek sırasında bir hata oluştu! : " + req.responseText);

        return response = {
            isSuccess: false,
            data: null,
            message: JSON.parse(req.responseText).error.message
        };
    },
    _getResponseHeaderEntityId: function (response) {

        var uri = response.getResponseHeader("OData-EntityId");
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(uri);
        return matches[1];
    },

    Create: function (object, logicalName, async, successCallback, errorCallback) {

        var query = this._oDataPath() + logicalName;

        var defaultCallBack = function (response, orginallSuccessCallback) {

            var responseModel = {
                isSuccess: true,
                id: Globals.Crm.API._getResponseHeaderEntityId(response)
            };

            orginallSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Post, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.send(JSON.stringify(object));
    },
    Update: function (id, object, logicalName, async, successCallback, errorCallback) {

        var query = this._oDataPath() + logicalName + "(" + id + ")";

        var defaultCallBack = function (response, orgincallSuccessCallback) {

            var responseModel = {
                isSuccess: true
            };

            orgincallSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Patch, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.send(JSON.stringify(object));
    },
    Delete: function (id, logicalName, async, successCallback, errorCallback) {

        var query = this._oDataPath() + logicalName + "(" + id + ")";

        var defaultCallBack = function (response, orgincallSuccessCallback) {

            var responseModel = {
                isSuccess: true
            };

            orgincallSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Delete, query, async, defaultCallBack, errorCallback, successCallback);

        req.send();
    },

    Retrieve: function (id, logicalName, select, expand, async, successCallback, errorCallback) {

        var systemQueryOptions = "";

        if (select != null || expand != null) {
            systemQueryOptions = "?";
            if (select != null) {
                var selectString = "$select=" + select;
                if (expand != null) {
                    selectString = selectString + "," + expand;
                }
                systemQueryOptions = systemQueryOptions + selectString;
            }
            if (expand != null) {
                systemQueryOptions = systemQueryOptions + "&$expand=" + expand;
            }
        }

        var query = this._oDataPath() + logicalName + "(" + id + ")" + systemQueryOptions;

        var defaultCallBack = function (response, orginallSuccessCallback) {

            var responseJSON = JSON.parse(response.responseText);
            var responseModel = {
                isSuccess: true,
                data: responseJSON
            };

            orginallSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Get, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.send();
    },
    RetrieveMultiple: function (logicalName, options, async, successCallback, OnComplete, errorCallback) {

        var optionsString;
        if (options != null) {
            if (options.charAt(0) != "?") {
                optionsString = "?" + options;
            }
            else { optionsString = options; }
        }

        var query = this._oDataPath() + logicalName + "" + optionsString;

        var defaultCallBack = function (response, orginalSuccesCallback) {

            var responseJSON = JSON.parse(response.responseText);
            var responseModel = {
                isSuccess: true,
                data: responseJSON.value
            };

            orginalSuccesCallback(responseModel);

            if (!responseJSON.nextLink) {
                if (OnComplete)
                    OnComplete(responseModel);
            }
            else {
                // TODO : Bir sonraki sayfa çekilecek
            }
        };

        var req = this._getDefaultRequestObject(this._methodType.Get, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.send();
    },

    Associate: function (parentId, parentLogicalName, relationshipName, childId, childLogicalName, async, successCallback, errorCallback) {

        var query = this._oDataPath() + parentLogicalName + "(" + parentId + ")/$ref/" + relationshipName;

        var defaultCallBack = function (response, orginalSuccessCallback) {

            var responseModel = {
                isSuccess: true
            };

            orginalSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Post, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        var childEntityReference = {};
        childEntityReference.uri = this._oDataPath() + "/" + childLogicalName + "(guid'" + childId + "')";
        req.send(JSON.stringify(childEntityReference));
    },
    Disassociate: function (parentId, parentLogicalName, relationshipName, childId, async, successCallback, errorCallback) {

        var query = this._oDataPath() + parentLogicalName + "(" + parentId + ")/$ref/" + relationshipName + "(" + childId + ")";

        var defaultCallBack = function (response, orginalSuccessCallback) {

            var responseModel = {
                isSuccess: true
            };

            orginalSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Post, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.setRequestHeader("X-HTTP-Method", "DELETE");

        req.send();
    },

    ExecuteWorkflow: function (workflowId, entityId, async, successCallback, errorCallback) {

        var query = this._oDataPath() + "workflows(" + workflowId.replace("}", "").replace("{", "") + ")/Microsoft.Dynamics.CRM.ExecuteWorkflow";

        var data = {
            "EntityId": entityId
        };

        var defaultCallBack = function (response, orginalSuccessCallback) {

            var responseModel = {
                isSuccess: true
            };

            orginalSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Post, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.send(JSON.stringify(data));
    },
    ExecuteAction: function (name, data, async, successCallback, errorCallback) {

        var query = this._oDataPath() + name;

        var defaultCallBack = function (response, orginalSuccessCallback) {

            var responseJSON = JSON.parse(response.responseText);
            var responseModel = {
                isSuccess: true,
                data: responseJSON
            };

            orginalSuccessCallback(responseModel);
        };

        var req = this._getDefaultRequestObject(this._methodType.Post, encodeURI(query), async, defaultCallBack, errorCallback, successCallback);

        req.send(JSON.stringify(data));
    }
};