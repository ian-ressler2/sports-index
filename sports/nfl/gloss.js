/* gloss.js: hover definitions for every NFL column. Line format: [groups:]LABEL|Full name|What it tells you */
addGloss(`
GP|Games played|Games the player or team appeared in.
ATT|Pass attempts|Passes thrown.
rb,tof:ATT|Rushing attempts|Carries.
k:ATT|Attempts|Kick attempts.
CMP|Completions|Passes caught by a teammate.
YDS|Yards|Total yards gained.
qb:YDS|Passing yards|Yards gained on completed passes.
rb:YDS|Rushing yards|Yards gained on carries.
rec:YDS|Receiving yards|Yards gained on catches.
p:YDS|Punt yards|Gross yards of all punts.
YDS/G|Yards per game|Yards per game played.
ATT/G|Attempts per game|Attempts per game played.
CMP%|Completion percentage|Completions divided by attempts.
Y/A|Yards per attempt|Passing yards per pass attempt.
ANY/A|Adjusted net yards per attempt|(Pass yards + 20 × TD − 45 × INT − sack yards) ÷ (attempts + sacks). Rewards touchdowns and punishes interceptions and sacks.
Y/C|Yards per completion|Passing yards per completion.
rb:Y/C|Yards per carry|Rushing yards per attempt.
tof:Y/C|Yards per carry|Rushing yards per attempt.
LNG|Longest play|Longest single play of the season.
TD|Touchdowns|Touchdowns scored.
qb:TD|Touchdown passes|Passing touchdowns thrown.
rb:TD|Rushing touchdowns|Touchdowns scored on the ground.
rec:TD|Receiving touchdowns|Touchdowns caught.
def:TD|Defensive touchdowns|Touchdowns scored on interception returns, fumble returns and other defensive plays.
TD%|Touchdown rate|Touchdowns per pass attempt.
rb:TD%|Touchdown rate|Touchdowns per carry.
INT|Interceptions|Passes thrown that the defense caught.
def:INT|Interceptions|Passes caught by the defender.
tdf:INT|Interceptions|Passes the defense intercepted.
tof:INT|Interceptions thrown|Passes the offense threw that the defense caught.
INT%|Interception rate|Interceptions per pass attempt.
SACK|Times sacked|Times the quarterback was tackled behind the line for a loss.
def:SACK|Sacks|Tackles of the quarterback behind the line of scrimmage.
tdf:SACKS|Sacks|Times the defense sacked the quarterback.
SACK%|Sack rate|Sacks taken per dropback.
SCK YDS|Sack yards|Yards lost to sacks.
def:SCK YDS|Sack yards|Yards lost by offenses on the player's sacks.
RTG|Passer rating|NFL formula from completion %, yards per attempt, TD % and INT %. 158.3 is perfect.
tof:RTG|Passer rating|The team's passer rating.
QBR|Total QBR|ESPN rating, 0 to 100, crediting every play by how much it changes the chance to win.
adjQBR|Adjusted QBR|QBR with the weight on garbage-time plays reduced.
1D|First downs|Plays that gained a first down.
1D%|First-down rate|Share of carries that produced a first down.
20+|Plays of 20+ yards|Carries or catches of at least 20 yards.
20+ %|20+ yard rate|Share of plays that went for 20 or more yards.
FUM|Fumbles|Times the player fumbled.
tof:FUM|Fumbles|Times the offense fumbled.
LOST|Fumbles lost|Fumbles the defense recovered.
tof:LOST|Fumbles lost|Fumbles the defense recovered.
FUM/100|Fumbles per 100 touches|How often the player fumbles per 100 carries and catches.
TGT|Targets|Passes thrown toward the player.
REC|Receptions|Catches.
TGT/G|Targets per game|Targets per game played.
REC/G|Receptions per game|Catches per game played.
CATCH%|Catch rate|Receptions divided by targets.
Y/R|Yards per reception|Receiving yards per catch.
Y/TGT|Yards per target|Receiving yards per target.
YAC|Yards after catch|Yards gained after making the catch.
YAC/R|Yards after catch per reception|Average yards after the catch per reception.
TD/TGT%|Touchdowns per target|Percent of targets that became touchdowns.
TKL|Total tackles|Solo plus assisted tackles.
SOLO|Solo tackles|Tackles made without help.
AST|Assisted tackles|Tackles shared with a teammate.
TKL/G|Tackles per game|Tackles per game played.
TFL|Tackles for loss|Tackles behind the line of scrimmage.
TFL/G|Tackles for loss per game|Tackles for loss per game played.
SACK/G|Sacks per game|Sacks per game played.
FF|Forced fumbles|Fumbles the defender caused.
PD|Passes defended|Passes the defender broke up or deflected.
PD/G|Passes defended per game|Passes defended per game played.
INT YDS|Interception return yards|Yards gained returning interceptions.
FR|Fumble recoveries|Fumbles recovered.
TKAWAY|Takeaways|Interceptions plus fumble recoveries.
FGM|Field goals made|Field goals made.
FGA|Field-goal attempts|Field goals attempted.
FG%|Field-goal percentage|Field goals made divided by attempted.
40-49 FG%|Field-goal percentage, 40-49 yards|Accuracy on kicks from 40 to 49 yards.
50+ FG%|Field-goal percentage, 50+ yards|Accuracy on kicks from 50 yards or longer.
50+ made|Field goals made, 50+ yards|Made kicks from 50 yards or longer.
50+ att|Field-goal attempts, 50+ yards|Attempts from 50 yards or longer.
40-49 made|Field goals made, 40-49 yards|Made kicks from 40 to 49 yards.
30-39 made|Field goals made, 30-39 yards|Made kicks from 30 to 39 yards.
20-29 made|Field goals made, 20-29 yards|Made kicks from 20 to 29 yards.
XPM|Extra points made|Extra-point kicks made.
XPA|Extra-point attempts|Extra-point kicks attempted.
XP%|Extra-point percentage|Extra points made divided by attempted.
k:PTS|Points|Points scored by kicking (field goals and extra points).
PTS/G|Points per game|Points per game played.
PUNTS|Punts|Total punts.
AVG|Gross punt average|Average distance of each punt.
NET|Net punt average|Punt distance minus return yards and touchbacks.
IN 20|Punts inside the 20|Punts downed inside the opponent's 20-yard line.
IN 20%|Inside-20 rate|Share of punts downed inside the 20.
TB|Touchbacks|Punts that went into the end zone.
TB%|Touchback rate|Share of punts that were touchbacks.
BLK|Punts blocked|Punts blocked by the defense.
FC|Fair catches|Punts fair caught by the returner.
RET|Punt returns|Punts the opponent returned.
RET YDS|Punt return yards allowed|Yards gained by opponent returners.
RET YDS/P|Return yards allowed per punt|Opponent punt-return yards divided by punts.
FUM LOST|Fumbles lost|Fumbles the defense recovered.
YDS/P|Yards per punt|Gross yards per punt.
W|Wins|Games won.
L|Losses|Games lost.
T|Ties|Games tied.
W%|Winning percentage|Wins divided by games played (ties count as half).
Pt diff/G|Point differential per game|Points scored minus points allowed per game.
PPG|Points per game|Points scored per game.
tof:YDS/G|Total yards per game|Offensive yards per game.
tdf:YDS/G|Yards allowed per game|Yards per game allowed by the defense.
Y/PLAY|Yards per play|Yards gained per offensive play.
PLAYS/G|Plays per game|Offensive plays run per game.
PASS%|Pass rate|Share of offensive plays that are passes.
PASS YDS/G|Passing yards per game|Passing yards per game.
PASS TD|Passing touchdowns|Touchdown passes thrown.
SACKED|Times sacked|Times the offense's quarterback was sacked.
RUSH YDS/G|Rushing yards per game|Rushing yards per game.
RUSH ATT/G|Rushing attempts per game|Carries per game.
RUSH TD|Rushing touchdowns|Touchdowns scored on the ground.
1D/G|First downs per game|First downs gained per game.
3RD%|Third-down conversion rate|Third downs converted to a first down.
4TH%|Fourth-down conversion rate|Fourth downs converted to a first down.
PEN/G|Penalties per game|Penalties called on the team per game.
PEN YDS/G|Penalty yards per game|Yards lost to penalties per game.
GIVEAWAYS|Giveaways|Turnovers the offense commits (interceptions plus fumbles lost).
PA/G|Points allowed per game|Points the defense gives up per game.
PA|Points allowed|Total points the defense gave up.
SACKS/G|Sacks per game|Sacks per game.
TAKEAWAYS|Takeaways|Turnovers forced (interceptions plus fumble recoveries).
TAKE/G|Takeaways per game|Takeaways per game.
TO diff|Turnover differential|Takeaways minus giveaways.
DEF TD|Defensive touchdowns|Touchdowns scored by the defense.
`);
