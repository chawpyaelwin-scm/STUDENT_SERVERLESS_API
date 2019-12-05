# デプロイ結果をSlackに通知
curl -X POST -H 'Content-type: application/json' \
  --data '{"text": "Thank you for your commit! Welcome Our Channel",
           "username": "CPL",
           "channel": "#website",
           "icon_emoji": ":tada:",
           }' \
https://hooks.slack.com/services/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
