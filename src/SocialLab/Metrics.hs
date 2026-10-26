module SocialLab.Metrics
  ( individualUtility
  , assignmentMetrics
  ) where

import qualified Data.Map.Strict as Map
import Data.Maybe (fromMaybe)
import SocialLab.Compatibility (directedAffinity)
import SocialLab.Types

individualUtility :: Scenario -> Assignment -> Person -> Double
individualUtility scenario assignment person =
  case peers of
    [] -> personOutsideOption person
    _ -> average (map (directedAffinity person) peers)
  where
    assignedGroup = fromMaybe (-1) (Map.lookup (personId person) assignment)
    peers =
      [ candidate
      | candidate <- scenarioPeople scenario
      , personId candidate /= personId person
      , Map.lookup (personId candidate) assignment == Just assignedGroup
      ]

assignmentMetrics :: Scenario -> Assignment -> AssignmentMetrics
assignmentMetrics scenario assignment =
  AssignmentMetrics
    { metricsIndividualUtilities = utilitiesByPerson
    , metricsCollectiveWelfare = average utilities
    , metricsMinimumSatisfaction = minimum utilities
    , metricsMaximumSatisfaction = maximum utilities
    , metricsSatisfactionGap = maximum utilities - minimum utilities
    }
  where
    people = scenarioPeople scenario
    utilitiesByPerson =
      Map.fromList
        [ (personId person, individualUtility scenario assignment person)
        | person <- people
        ]
    utilities = Map.elems utilitiesByPerson

average :: [Double] -> Double
average [] = 0
average values = sum values / fromIntegral (length values)

