/  google-cn:/ { in_gcn = 1 }
in_gcn && /    behavior: domain/ {
    print
    print "  category-ai-!cn:"
    print "    type: http"
    print "    interval: 7200"
    print "    path: ./rule_provider/category-ai-!cn.mrs"
    print "    url: \"https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs\""
    print "    format: mrs"
    print "    behavior: domain"
    in_gcn = 0
    next
}
/  - RULE-SET,local_SpecificProxySites,SpecificProxySites/ {
    print
    print "  - RULE-SET,category-ai-!cn,NOHKSites"
    next
}
{ print }
