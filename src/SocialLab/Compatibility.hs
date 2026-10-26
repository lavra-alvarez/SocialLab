module SocialLab.Compatibility
  ( similarity
  , directedAffinity
  , mutualCompatibility
  , affinityCells
  , compatibilityCells
  ) where

import qualified Data.Map.Strict as Map
import SocialLab.Types

similarity :: Double -> Double -> Double
similarity actual ideal = clamp 0 1 (1 - abs (actual - ideal) / 10)

directedAffinity :: Person -> Person -> Double
directedAffinity source target =
  100 * weightedSimilarity / totalWeight
  where
    preferences = Map.toList (personPreferences source)
    totalWeight = sum [preferenceWeight preference | (_, preference) <- preferences]
    weightedSimilarity =
      sum
        [ preferenceWeight preference
            * similarity (Map.findWithDefault 0 criterion (personTraits target)) (preferenceIdeal preference)
        | (criterion, preference) <- preferences
        ]

mutualCompatibility :: Person -> Person -> Double
mutualCompatibility firstPerson secondPerson =
  (directedAffinity firstPerson secondPerson + directedAffinity secondPerson firstPerson) / 2

affinityCells :: [Person] -> [AffinityCell]
affinityCells people =
  [ AffinityCell (personId source) (personId target) (directedAffinity source target)
  | source <- people
  , target <- people
  , personId source /= personId target
  ]

compatibilityCells :: [Person] -> [CompatibilityCell]
compatibilityCells people =
  [ CompatibilityCell (personId firstPerson) (personId secondPerson) (mutualCompatibility firstPerson secondPerson)
  | (index, firstPerson) <- zip [0 :: Int ..] people
  , secondPerson <- drop (index + 1) people
  ]

clamp :: Ord value => value -> value -> value -> value
clamp minimumValue maximumValue = max minimumValue . min maximumValue

