module SocialLab.Nash
  ( allDeviations
  , profitableDeviations
  , isNashEquilibrium
  ) where

import qualified Data.Map.Strict as Map
import Data.Maybe (fromMaybe)
import SocialLab.Assignments (membersInGroup, movePerson)
import SocialLab.Metrics (individualUtility)
import SocialLab.Types

allDeviations :: Scenario -> Assignment -> [Deviation]
allDeviations scenario assignment =
  case scenarioMode scenario of
    PairFormation -> []
    TeamFormation ->
      [ buildDeviation person currentGroup alternativeGroup
      | person <- scenarioPeople scenario
      , let currentGroup = fromMaybe (-1) (Map.lookup (personId person) assignment)
      , length (membersInGroup currentGroup assignment) > 1
      , alternativeGroup <- [0 .. scenarioGroupCount scenario - 1]
      , alternativeGroup /= currentGroup
      ]
  where
    buildDeviation person currentGroup alternativeGroup =
      Deviation
        { deviationPersonId = personId person
        , deviationFromGroup = currentGroup
        , deviationToGroup = alternativeGroup
        , deviationCurrentUtility = currentUtility
        , deviationAlternativeUtility = alternativeUtility
        , deviationGain = alternativeUtility - currentUtility
        }
      where
        currentUtility = individualUtility scenario assignment person
        alternativeAssignment = movePerson (personId person) alternativeGroup assignment
        alternativeUtility = individualUtility scenario alternativeAssignment person

profitableDeviations :: Scenario -> Assignment -> [Deviation]
profitableDeviations scenario =
  filter ((> epsilon) . deviationGain) . allDeviations scenario
  where
    epsilon = 1.0e-9

isNashEquilibrium :: Scenario -> Assignment -> Bool
isNashEquilibrium scenario = null . profitableDeviations scenario

