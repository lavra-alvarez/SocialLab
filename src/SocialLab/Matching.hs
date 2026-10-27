module SocialLab.Matching
  ( blockingPairs
  , isStableMatching
  ) where

import qualified Data.Map.Strict as Map
import Data.Maybe (mapMaybe)
import SocialLab.Compatibility (directedAffinity)
import SocialLab.Types

blockingPairs :: Scenario -> Assignment -> [BlockingPair]
blockingPairs scenario assignment =
  [ BlockingPair
      { blockingFirstId = personId firstPerson
      , blockingSecondId = personId secondPerson
      , blockingFirstGain = firstGain
      , blockingSecondGain = secondGain
      }
  | (index, firstPerson) <- zip [0 :: Int ..] people
  , secondPerson <- drop (index + 1) people
  , Map.lookup (personId firstPerson) assignment /= Map.lookup (personId secondPerson) assignment
  , let firstGain = gainOverCurrentPartner firstPerson secondPerson
  , let secondGain = gainOverCurrentPartner secondPerson firstPerson
  , firstGain > epsilon
  , secondGain > epsilon
  ]
  where
    people = scenarioPeople scenario
    epsilon = 1.0e-9

    gainOverCurrentPartner person candidate =
      directedAffinity person candidate - currentPartnerAffinity person

    currentPartnerAffinity person =
      case currentPartners person of
        partner : _ -> directedAffinity person partner
        [] -> personOutsideOption person

    currentPartners person =
      mapMaybe (partnerInSameGroup person) people

    partnerInSameGroup person candidate
      | personId person == personId candidate = Nothing
      | Map.lookup (personId person) assignment == Map.lookup (personId candidate) assignment = Just candidate
      | otherwise = Nothing

isStableMatching :: Scenario -> Assignment -> Bool
isStableMatching scenario = null . blockingPairs scenario
