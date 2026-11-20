import { aitoPostRaw, nonExclusivePredict } from './aito-client'

/**
 * Analyzes a user prompt to determine its type and extract relevant information
 * Uses Aito.ai's predictive capabilities to classify prompts as questions, feedback, or requests
 * and extract structured data accordingly
 * 
 * @param {string} question - The user's input prompt to analyze
 * @returns {Promise<Object>} - Structured analysis result with type and extracted data
 */
export function prompt(question) {
  // First, predict the type of prompt (question, feedback, or request)
  return aitoPostRaw('_predict', {
    "from": "prompts",
    "where" : {
      "prompt": question
    },
    "predict": "type",
    "limit": 1
  }).then(result => {
      const top = result.data.hits[0]
      if (top.$p > 0.5) {
        if (top.feature === "question") {
          return aitoPostRaw('_query', {
            "from": "prompts",
            "where" : {
              "$nn": [{"prompt": question}]
            },
            "orderBy": {"$sameness": {"prompt": question} },
            "limit": 1,
            "select": ["prompt", "type", "answer.answer"]
          }).then(result => {
            var match = null
      
            if (result.data.hits.length > 0) {
              match = result.data.hits[0]
            }
            return match
          })
        } else if (top.feature === "feedback") {
          // Plain field names. This list used to carry the `.$feature`
          // spelling for categories, which is what broke Help: `.$feature` IS
          // the non-exclusive per-member form, and because the string was not
          // literally "tags" it also fell through to the exclusive arm below
          // and picked up `exclusiveness: true`. The resulting body asked v2
          // for per-member and exclusive scoring at once, and v2 answered 400
          // — so every piece of feedback anyone typed failed.
          const fields = ["sentiment", "categories", "tags"]
          // Multi-valued: a prompt really can be about produce AND queueing,
          // so these are scored per member rather than competing for one slot.
          // `sentiment` is single-valued and stays exclusive. The `request`
          // branch below has always treated categories this way; only this
          // branch disagreed.
          const multiValued = ["categories", "tags"]

          return Promise.all(fields.map(predicted => {
            // v2 rejects `exclusiveness: false` outright, so the non-exclusive
            // case goes through the client helper while the exclusive one
            // keeps the explicit flag (v2 accepts `true`).
            const target = multiValued.includes(predicted)
              ? nonExclusivePredict(predicted)
              : { predict: predicted, exclusiveness: true }

            return aitoPostRaw('_predict', {
              from: 'prompts',
              where: {
                "prompt": question,
                "type": "feedback"
              },
              ...target,
              limit: 1
            }).then(response => response.data.hits[0])
          })).then(responses => {
            var rv = {
              "type": "feedback"
            }
            console.log(JSON.stringify(responses))
            for (var i = 0; i < fields.length; i++) {
              if (responses[i].$p >= 0.5) {
                rv[fields[i]] = responses[i].feature
              }
            }
            console.log(JSON.stringify(rv))
            return rv
          })
        } else if (top.feature === "request") {
          const assignee = aitoPostRaw('_query', {
            from: 'prompts',
            where: {
              "prompt": question,
              "type": "request"
            },
            get: "assignee",
            orderBy: "$p",
            // `assignee` links to employees.Name, and the two versions project a
            // `get` over a link differently when nothing is selected:
            //   v1 -> the RESOLVED target row {Name, Role, Department, Superior}
            //   v2 -> the value {$value: "Frank Wilson"}
            // Both identify the same person; only v1 hands back the fields this
            // caller reads, so on v2 the page rendered "undefined (undefined)".
            //
            // Naming them explicitly resolves the link on BOTH versions and is
            // the more honest query anyway — the default projection was never
            // something to rely on. v2 also returns `$value` alongside, which
            // nothing here reads.
            select: ["$p", "Name", "Role"],
            limit: 1
          }).then(response => {
            const top = response.data.hits[0]
            return [top.$p, `${top.Name} (${top.Role})`]
          }) 

          const categories = aitoPostRaw('_predict', {
            from: {
              "from": 'prompts',
              "where": {
                "type": "request"
              }
            },
            where: {
              "prompt": question
            },
            ...nonExclusivePredict('categories'),
            limit: 1
          }).then(response => {
            const top = response.data.hits[0]
            return [top.$p, top.feature]
          }) 

          const urgency = aitoPostRaw('_predict', {
            from: 'prompts',
            where: {
              "prompt": question,
              "type": "request"
            },
            predict: "urgency",
            limit: 1
          }).then(response => {
            const top = response.data.hits[0]
            return [top.$p, top.feature]
          }) 

          const fields = ["assignee", "categories", "urgency"]

          return Promise.all([assignee, categories, urgency]).then(responses => {
            var rv = {
              "type": "request"
            }
            console.log(JSON.stringify(responses))
            for (var i = 0; i < fields.length; i++) {
              if (responses[i][0] >= 0.25) {
                rv[fields[i]] = responses[i][1]
              }
            }
            console.log(JSON.stringify(rv))
            return rv
          })
        }
      }
      return {
        "type": null
      }
    })
}
