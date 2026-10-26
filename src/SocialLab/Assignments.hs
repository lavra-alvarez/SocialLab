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
  map (Map.fromList . zip personIds) groupChoices
  where
    personIds = map personId (scenarioPeople scenario)
    availableGroups = [0 .. scenarioGroupCount scenario - 1]
    groupChoices = sequence (replicate (length personIds) availableGroups)

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

