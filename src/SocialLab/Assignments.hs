module SocialLab.Assignments
  ( allAssignments
  , groupOf
  , membersInGroup
  , movePerson
  ) where

import qualified Data.Map.Strict as Map
import Data.Text (Text)
import SocialLab.Types

allAssignments :: Scenario -> [Assignment]
allAssignments scenario =
  case scenarioMode scenario of
    TeamFormation -> teamAssignments scenario
    PairFormation -> pairAssignments scenario

teamAssignments :: Scenario -> [Assignment]
teamAssignments scenario =
  map (Map.fromList . zip personIds) validProfiles
  where
    personIds = map personId (scenarioPeople scenario)
    availableGroups = [0 .. scenarioGroupCount scenario - 1]
    profiles = groupProfiles (length personIds) availableGroups
    validProfiles = filter (\profile -> all (`elem` profile) availableGroups) profiles

-- Producto cartesiano escrito de forma recursiva para generar estrategias.
groupProfiles :: Int -> [Int] -> [[Int]]
groupProfiles 0 _ = [[]]
groupProfiles numberOfPeople availableGroups =
  [ groupId : remainingProfile
  | groupId <- availableGroups
  , remainingProfile <- groupProfiles (numberOfPeople - 1) availableGroups
  ]

pairAssignments :: Scenario -> [Assignment]
pairAssignments scenario =
  map pairsToAssignment (perfectMatchings personIds)
  where
    personIds = map personId (scenarioPeople scenario)

pairsToAssignment :: [(Text, Text)] -> Assignment
pairsToAssignment pairs =
  Map.fromList
    [ (personId, groupId)
    | (groupId, (firstId, secondId)) <- zip [0 ..] pairs
    , personId <- [firstId, secondId]
    ]

-- Al fijar la primera persona se evitan copias de un mismo matching.
perfectMatchings :: [Text] -> [[(Text, Text)]]
perfectMatchings [] = [[]]
perfectMatchings (firstId : remainingIds) =
  [ (firstId, secondId) : remainingPairs
  | (secondId, unpairedIds) <- selectOne remainingIds
  , remainingPairs <- perfectMatchings unpairedIds
  ]

selectOne :: [value] -> [(value, [value])]
selectOne [] = []
selectOne (value : values) =
  (value, values)
    : [ (selected, value : remaining)
      | (selected, remaining) <- selectOne values
      ]

groupOf :: Text -> Assignment -> Maybe Int
groupOf = Map.lookup

membersInGroup :: Int -> Assignment -> [Text]
membersInGroup groupId assignment =
  [ memberId
  | (memberId, assignedGroup) <- Map.toList assignment
  , assignedGroup == groupId
  ]

movePerson :: Text -> Int -> Assignment -> Assignment
movePerson = Map.insert

