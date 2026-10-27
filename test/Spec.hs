{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import Control.Monad (forM_, unless)
import qualified Data.Map.Strict as Map
import Data.Text (Text)
import SocialLab.Analysis (analyzeScenario, buildAssignmentResult)
import SocialLab.Assignments (allAssignments, membersInGroup)
import SocialLab.Compatibility (directedAffinity, mutualCompatibility, similarity)
import SocialLab.Example (exampleScenarios)
import SocialLab.Matching (blockingPairs)
import SocialLab.Metrics (individualUtility)
import SocialLab.Nash (profitableDeviations)
import SocialLab.Types
import SocialLab.Validation (validateScenario)

main :: IO ()
main = do
  run "el escenario de ejemplo es válido" testValidScenario
  run "la similitud respeta los extremos" testSimilarity
  run "la afinidad dirigida puede ser asimétrica" testDirectedAffinity
  run "la compatibilidad mutua es simétrica" testMutualCompatibility
  run "se generan 62 distribuciones no vacías" testTeamAssignmentCount
  run "se generan 15 matchings perfectos" testPairAssignmentCount
  run "cada matching contiene tres parejas" testPairAssignmentShape
  run "una persona sola recibe su utilidad de reserva" testOutsideOption
  run "los equilibrios Nash no tienen desviaciones rentables" testNashResults
  run "los matchings estables no tienen parejas bloqueantes" testStableMatchingResults
  run "los óptimos sociales dominan las demás asignaciones" testSocialOptima
  putStrLn "\nTodas las pruebas de SocialLab pasaron."

run :: String -> IO () -> IO ()
run name test = do
  test
  putStrLn ("✓ " <> name)

testValidScenario :: IO ()
testValidScenario =
  forM_ exampleScenarios (assertEqual [] . validateScenario)

testSimilarity :: IO ()
testSimilarity = do
  assertApprox 1 (similarity 6 6)
  assertApprox 0 (similarity 0 10)
  assertApprox 0.7 (similarity 4 7)

testDirectedAffinity :: IO ()
testDirectedAffinity = do
  let firstPerson =
        Person
          { personId = "first"
          , personName = "Primera"
          , personTraits = Map.singleton "criterio" 10
          , personPreferences = Map.singleton "criterio" (Preference 10 1)
          , personOutsideOption = 0
          }
      secondPerson =
        Person
          { personId = "second"
          , personName = "Segunda"
          , personTraits = Map.singleton "criterio" 0
          , personPreferences = Map.singleton "criterio" (Preference 10 1)
          , personOutsideOption = 0
          }
  assertApprox 0 (directedAffinity firstPerson secondPerson)
  assertApprox 100 (directedAffinity secondPerson firstPerson)

testMutualCompatibility :: IO ()
testMutualCompatibility = do
  let ana = findPerson "ana"
      bruno = findPerson "bruno"
  assertApprox (mutualCompatibility ana bruno) (mutualCompatibility bruno ana)

testTeamAssignmentCount :: IO ()
testTeamAssignmentCount = do
  assertEqual 62 (length assignments)
  assertBool (all hasTwoNonEmptyTeams assignments)
  where
    assignments = allAssignments teamScenario
    hasTwoNonEmptyTeams assignment =
      all (not . null . (`membersInGroup` assignment)) [0, 1]

testPairAssignmentCount :: IO ()
testPairAssignmentCount =
  assertEqual 15 (length (allAssignments pairScenario))

testPairAssignmentShape :: IO ()
testPairAssignmentShape =
  forM_ (allAssignments pairScenario) $ \assignment ->
    assertEqual [2, 2, 2] [length (membersInGroup groupId assignment) | groupId <- [0, 1, 2]]

testOutsideOption :: IO ()
testOutsideOption = do
  let ana = findPerson "ana"
      assignment =
        Map.fromList
          [ (personId person, if personId person == "ana" then 0 else 1)
          | person <- scenarioPeople teamScenario
          ]
  assertApprox (personOutsideOption ana) (individualUtility teamScenario assignment ana)

testNashResults :: IO ()
testNashResults =
  case analyzeScenario teamScenario of
    Left errors -> fail (show errors)
    Right analysis -> do
      assertBool (not (null (analysisStableAssignments analysis)))
      forM_
        (analysisStableAssignments analysis)
        (\result -> assertEqual [] (profitableDeviations teamScenario (resultAssignment result)))

testStableMatchingResults :: IO ()
testStableMatchingResults =
  case analyzeScenario pairScenario of
    Left errors -> fail (show errors)
    Right analysis -> do
      assertBool (not (null (analysisStableAssignments analysis)))
      forM_
        (analysisStableAssignments analysis)
        (\result -> assertEqual [] (blockingPairs pairScenario (resultAssignment result)))

testSocialOptima :: IO ()
testSocialOptima =
  forM_ exampleScenarios assertSocialOptimum

assertSocialOptimum :: Scenario -> IO ()
assertSocialOptimum scenario =
  case analyzeScenario scenario of
    Left errors -> fail (show errors)
    Right analysis -> do
      let bestWelfare = metricsCollectiveWelfare (resultMetrics (analysisSocialOptimum analysis))
          otherWelfares =
            [ metricsCollectiveWelfare (resultMetrics (buildAssignmentResult scenario assignment))
            | assignment <- allAssignments scenario
            ]
      assertBool (all (<= bestWelfare + tolerance) otherWelfares)

findPerson :: Text -> Person
findPerson identifier =
  case filter ((== identifier) . personId) (scenarioPeople teamScenario) of
    person : _ -> person
    [] -> error "Persona de prueba inexistente"

assertBool :: Bool -> IO ()
assertBool condition = unless condition (fail "La condición esperada no se cumplió")

assertEqual :: (Eq value, Show value) => value -> value -> IO ()
assertEqual expected actual =
  unless (expected == actual) (fail ("Esperado: " <> show expected <> ", obtenido: " <> show actual))

assertApprox :: Double -> Double -> IO ()
assertApprox expected actual =
  unless (abs (expected - actual) <= tolerance) (fail ("Esperado: " <> show expected <> ", obtenido: " <> show actual))

tolerance :: Double
tolerance = 1.0e-7

teamScenario :: Scenario
teamScenario = scenarioWithMode TeamFormation

pairScenario :: Scenario
pairScenario = scenarioWithMode PairFormation

scenarioWithMode :: ScenarioMode -> Scenario
scenarioWithMode mode =
  case filter ((== mode) . scenarioMode) exampleScenarios of
    scenario : _ -> scenario
    [] -> error "Escenario de prueba inexistente"

