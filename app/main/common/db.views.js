/**
 * Created by shalitha on 25/5/16.
 */
var views = {
  'view_keyboard': 'CREATE VIEW view_keyboard AS  SELECT  * FROM  (SELECT     KeyboardPages.Id AS MainPageId, KeyboardPageInfo.Id AS SubPage, KeyboardPages.KeyboardLayoutMasterId, KeyboardPageInfo.PageDesc11, KeyboardPageInfo.PageDesc12, KeyboardPageInfo.PageDesc13, KeyboardPageInfo.PageDesc21, KeyboardPageInfo.PageDesc22, KeyboardPageInfo.PageDesc23, KeyboardPageInfo.ImageName, KeyboardPageInfo.KeyboardLayoutId, KeyboardPageInfo.KeyNo, NULL AS ValidFrom, NULL AS ValidTo, \'P\' AS Type, \'\' AS PLU, \'\' AS SubPLU1Code, \'\' AS SubPLU2Code, \'\' AS SubPLU3Code, KeyboardPageInfo.Colour FROM KeyboardPages INNER JOIN KeyboardPageInfo ON KeyboardPages.Id = KeyboardPageInfo.KeyboardPageId UNION ALL SELECT     KeyboardPages.Id AS PageId, - 1, KeyboardPages.KeyboardLayoutMasterId, KayboardKeyInfo.KeyDesc11, KayboardKeyInfo.KeyDesc12, KayboardKeyInfo.KeyDesc13, KayboardKeyInfo.KeyDesc21, KayboardKeyInfo.KeyDesc22, KayboardKeyInfo.KeyDesc23, KayboardKeyInfo.ImageName, KayboardKeyInfo.KeyboardLayoutId, CASE WHEN KayboardKeyInfo.PageKeyNo IS NULL THEN KayboardKeyInfo.KeyNo ELSE - 1 END AS KeyNo, KayboardKeyInfo.ValidFrom, KayboardKeyInfo.ValidTo, \'K\' AS Type, KayboardKeyInfo.PLU, KayboardKeyInfo.SubPLU1Code, KayboardKeyInfo.SubPLU2Code, KayboardKeyInfo.SubPLU3Code, KayboardKeyInfo.Color FROM KeyboardPages INNER JOIN KayboardKeyInfo ON KeyboardPages.Id = KayboardKeyInfo.KeyboardPageId WHERE     KayboardKeyInfo.PageKeyNo IS NULL) AS dd'
};

angular.module('itouch.config').constant('DB_VIEWS', views);
