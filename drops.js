'use strict'

var items = {
  "40000001": "Minor Power Orb",
  "40000002": "Lesser Power Orb",
  "40000003": "Power Orb",
  "40000004": "Greater Power Orb",
  "40000005": "Major Power Orb",

  "40000006": "Minor White Orb",
  "40000007": "Lesser White Orb",
  "40000008": "White Orb",
  "40000009": "Greater White Orb",
  "40000010": "Major White Orb",

  "40000011": "Minor Black Orb",
  "40000012": "Lesser Black Orb",
  "40000013": "Black Orb",
  "40000014": "Greater Black Orb",
  "40000015": "Major Black Orb",

  "40000021": "Minor Summon Orb",
  "40000022": "Lesser Summon Orb",
  "40000023": "Summon Orb",
  "40000024": "Greater Summon Orb",
  "40000025": "Major Summon Orb",

  "40000026": "Minor Non Elemental Orb",
  "40000027": "Lesser Non Elemental Orb",
  "40000028": "Non Elemental Orb",
  "40000029": "Greater Non Elemental Orb",
  "40000030": "Major Non Elemental Orb",

  "40000031": "Minor Fire Orb",
  "40000032": "Lesser Fire Orb",
  "40000033": "Fire Orb",
  "40000034": "Greater Fire Orb",
  "40000035": "Major Fire Orb",

  "40000036": "Minor Ice Orb",
  "40000037": "Lesser Ice Orb",
  "40000038": "Ice Orb",
  "40000039": "Greater Ice Orb",
  "40000040": "Major Ice Orb",

  "40000041": "Minor Lightning Orb",
  "40000042": "Lesser Lightning Orb",
  "40000043": "Lightning Orb",
  "40000044": "Greater Lightning Orb",
  "40000045": "Major Lightning Orb",

  "40000046": "Minor Earth Orb",
  "40000047": "Lesser Earth Orb",
  "40000048": "Earth Orb",
  "40000049": "Greater Earth Orb",
  "40000050": "Major Earth Orb",

  "40000051": "Minor Wind Orb",
  "40000052": "Lesser Wind Orb",
  "40000053": "Wind Orb",
  "40000054": "Greater Wind Orb",
  "40000055": "Major Wind Orb",

  "40000056": "Minor Holy Orb",
  "40000057": "Lesser Holy Orb",
  "40000058": "Holy Orb",
  "40000059": "Greater Holy Orb",
  "40000060": "Major Holy Orb",

  "40000061": "Minor Dark Orb",
  "40000062": "Lesser Dark Orb",
  "40000063": "Dark Orb",
  "40000064": "Greater Dark Orb",
  "40000065": "Major Dark Orb",

  "40000066": "Power Crystal",
  "40000067": "White Crystal",
  "40000068": "Black Crystal",
  "40000070": "Summon Crystal",
  "40000071": "Non Elemental Crystal",
  "40000072": "Fire Crystal",
  "40000073": "Ice Crystal",
  "40000074": "Lightning Crystal",
  "40000075": "Earth Crystal",
  "40000076": "Wind Crystal",
  "40000077": "Holy Crystal",
  "40000078": "Dark Crystal",

  "92000000": "Gil"
};

function getDropInfo(drop) {
  drop.num = drop.num || drop.amount || '1';
  
  if(drop.amount) {
    drop.name = "Gil";
  } else if(drop.item_id) {
    drop.name = items[drop.item_id] || "Unknown Item: " + drop.uid;
  } else {
    var id = "";
    for(var i in drop) {
      id += (i + ": " + drop[i]);
    }
    drop.name = "Unknown Item: " + id;
  }

  drop.image = getDropImage(drop);

  return drop;
}

function getDropImage(drop) {
  if(drop.amount) {
    return "http://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/common_item/92000000.png";
  } else if(drop.item_id) {
    return 'https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/ability_material/'+drop.item_id+'/'+drop.item_id+'_112.png';
  }

  return 'https://placeholdit.imgix.net/~text?txtsize=50&txt=%3F&w=112&h=112&txttrack=0';
}

module.exports = getDropInfo;