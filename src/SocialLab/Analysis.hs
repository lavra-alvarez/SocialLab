module SocialLab.Analysis
  ( analyzeScenario
  , buildAssignmentResult
  ) where

import Data.Function (on)
import Data.List (maximumBy, sortBy)
import Data.Ord (comparing)
import Data.Text (Text)
import SocialLab.Assignments (allAssignments)
import SocialLab.Compatibility (affinityCells, compatibilityCells)
import SocialLab.Metrics (assignmentMetrics)
import SocialLab.Nash (profitableDeviations)
import SocialLab.Types
import SocialLab.Validation (validateScenario)

analyzeScenario :: Scenario -> Either [Text] AnalysisResponse
analyzeScenario scenario =
  case validateScenario scenario of
    [] -> Right response
    errors -> Left errors
  where
    assignments = allAssignments scenario
    results = map (buildAssignmentResult scenario) assignments
    socialOptimum = maximumBy (comparing socialScore) results
    fairOptimum = maximumBy (comparing fairScore) results
    equilibria =
      sortBy (flip compare `on` socialScore) (filter resultIsNash results)

    response =
      AnalysisResponse
        { analysisScenario = scenario
        , analysisTotalAssignments = length assignments
        , analysisAffinities = affinityCells (scenarioPeople scenario)
        , analysisCompatibilities = compatibilityCells (scenarioPeople scenario)
        , analysisSocialOptimum = socialOptimum
        , analysisFairOptimum = fairOptimum
        , analysisNashEquilibria = equilibria
        }

buildAssignmentResult :: Scenario -> Assignment -> AssignmentResult
buildAssignmentResult scenario assignment =
  AssignmentResult
    { resultAssignment = assignment
    , resultMetrics = assignmentMetrics scenario assignment
    , resultIsNash = null deviations
    , resultDeviations = deviations
    }
  where
    deviations = profitableDeviations scenario assignment

socialScore :: AssignmentResult -> (Double, Double, Double)
socialScore result =
  ( metricsCollectiveWelfare metrics
  , metricsMinimumSatisfaction metrics
  , negate (metricsSatisfactionGap metrics)
  )
  where
    metrics = resultMetrics result

fairScore :: AssignmentResult -> (Double, Double, Double)
fairScore result =
  ( metricsMinimumSatisfaction metrics
  , metricsCollectiveWelfare metrics
  , negate (metricsSatisfactionGap metrics)
  )
  where
    metrics = resultMetrics result

