import json, os, random, re, sys, urllib.parse
from playwright.sync_api import sync_playwright
random.seed(4)
TEAMS=[108,109,110,111,112,113,114,115,116,117,118,119,120,121,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,158]
DIVS=['American League East','American League Central','American League West','National League East','National League Central','National League West']
teams=[{'id':t,'name':f'City{t} Team{t}','abbreviation':f'T{t%100}','teamName':f'Team{t}','locationName':f'City{t}','league':{'name':'American League' if i<15 else 'National League'},'division':{'name':DIVS[i//5]},'venue':{'name':'Park'}} for i,t in enumerate(TEAMS)]
recs={}
for i,t in enumerate(TEAMS):
    w=random.randint(60,102); recs[t]=dict(team={'id':t},wins=w,losses=162-w,winningPercentage=f'{w/162:.3f}',gamesPlayed=162,runsScored=random.randint(600,850),runsAllowed=random.randint(600,850),runDifferential=0,streak={'streakCode':'W2'},divisionRank=str(i%5+1),leagueRank='3',gamesBack='-',clinched=False,divisionChamp=i%5==0,wildCardRank='1',records={'splitRecords':[]})
standings={'records':[{'division':{'id':i},'teamRecords':[recs[TEAMS[i*5+j]] for j in range(5)]} for i in range(6)]}
def bstat():
    pa=random.randint(150,700);ab=int(pa*.89);h=int(ab*random.uniform(.2,.3));hr=random.randint(0,45);so=int(pa*random.uniform(.12,.3));bb=int(pa*random.uniform(.05,.14))
    return dict(plateAppearances=pa,atBats=ab,hits=h,doubles=h//5,triples=1,homeRuns=hr,runs=h//2,rbi=h//2,baseOnBalls=bb,strikeOuts=so,hitByPitch=3,stolenBases=random.randint(0,40),caughtStealing=2,sacFlies=3,totalBases=h+hr*2,avg=f'{h/ab:.3f}',obp=f'{(h+bb)/pa:.3f}',slg=f'{(h+hr*3)/ab:.3f}',ops=f'{(h+bb)/pa+(h+hr*3)/ab:.3f}',babip='.300',gamesPlayed=int(pa/4.2),age=random.randint(21,38))
def pstat():
    ip=random.randint(40,200);bf=ip*4+random.randint(0,30)
    return dict(battersFaced=bf,inningsPitched=f'{ip}.{random.randint(0,2)}',gamesPlayed=random.randint(20,34),gamesStarted=random.randint(0,32),wins=8,losses=6,saves=0,holds=0,hits=ip,runs=ip//2,earnedRuns=ip//2-3,homeRuns=ip//8,baseOnBalls=ip//3,strikeOuts=int(ip*random.uniform(.7,1.3)),hitByPitch=4,numberOfPitches=ip*15,atBats=bf-30,sacFlies=3,era=f'{random.uniform(2.5,5.5):.2f}',whip='1.20',avg='.240',obp='.300',slg='.400',ops='.700',strikeoutsPer9Inn='9.1',walksPer9Inn='2.9',homeRunsPer9='1.1',age=28)
POS=['C','1B','2B','3B','SS','LF','CF','RF','DH']
bats=[dict(player={'id':1000+i,'fullName':f'Bat Player{i}'},team={'id':TEAMS[i%30]},position={'abbreviation':POS[i%9]},numTeams=1,stat=bstat()) for i in range(240)]
pits=[dict(player={'id':2000+i,'fullName':f'Pit Hurler{i}'},team={'id':TEAMS[i%30]},position={'abbreviation':'P'},numTeams=1,stat=pstat()) for i in range(150)]
bsab=[dict(player=b['player'],stat=dict(woba=f'{random.uniform(.28,.40):.3f}',wRcPlus=random.randint(60,170),wRaa='3.1',war=f'{random.uniform(-1,8):.1f}',batting='5',baseRunning='1',fielding='2')) for b in bats]
psab=[dict(player=b['player'],stat=dict(fip=f'{random.uniform(2.5,5):.2f}',xfip='3.5',fipMinus=90,eraMinus=95,war=f'{random.uniform(-1,6):.1f}',ra9War='2.0')) for b in pits]
def tstat(split,group):
    return dict(team={'id':split},stat=(dict(gamesPlayed=162,plateAppearances=6200,atBats=5500,runs=recs[split]['runsScored'],hits=1400,doubles=250,triples=20,homeRuns=190,rbi=650,baseOnBalls=500,strikeOuts=1300,stolenBases=90,caughtStealing=30,hitByPitch=60,sacFlies=40,avg='.250',obp='.320',slg='.410',ops='.730',babip='.295') if group=='hitting' else dict(gamesPlayed=162,inningsPitched='1440.0',saves=40,hits=1350,runs=recs[split]['runsAllowed'],earnedRuns=650,homeRuns=180,baseOnBalls=480,strikeOuts=1400,hitByPitch=60,battersFaced=6100,atBats=5500,sacFlies=40,era='4.05',whip='1.28',avg='.245',obp='.315',slg='.400',ops='.715',strikeoutsPer9Inn='8.8',walksPer9Inn='3',homeRunsPer9='1.1')))
def csv(rows):
    keys=list(rows[0].keys()); return ','.join(keys)+'\n'+'\n'.join(','.join(str(r[k]) for k in keys) for r in rows)
def r(a,b,d=1): return round(random.uniform(a,b),d)
def sav_custom(ps,pit=False):
    out=[]
    for p in ps:
        o={'player_id':p['player']['id'],'"last_name, first_name"':'x','year':2025,'pa':300}
        for k in ['xba','xslg','woba','xwoba','xobp','xiso','wobacon','xwobacon']: o[k]=f'{r(.22,.45,3)}'
        o['xera']=r(2.5,5.5,2); o['exit_velocity_avg']=r(85,93);o['launch_angle_avg']=r(5,20);o['sweet_spot_percent']=r(28,40);o['barrel_batted_rate']=r(2,18);o['hard_hit_percent']=r(30,55);o['avg_best_speed']=r(95,104)
        o['whiff_percent']=r(15,35);o['swing_percent']=r(40,55);o['avg_swing_speed']=r(66,76);o['fast_swing_rate']=r(10,60);o['squared_up_contact']=r(15,40)
        for k in ['groundballs_percent','flyballs_percent','linedrives_percent','popups_percent','pull_percent','straightaway_percent','opposite_percent','z_swing_percent','oz_swing_percent','oz_contact_percent','iz_contact_percent','in_zone_percent','edge_percent','meatball_swing_percent','f_strike_percent']: o[k]=r(5,60)
        o['sprint_speed']=r(24,30)
        out.append(o)
    return csv(out)
tracking=csv([{'id':b['player']['id'],'name':'x','avg_bat_speed':r(66,76),'hard_swing_rate':r(.1,.6,2),'squared_up_per_bat_contact':r(.15,.4,2),'blast_per_bat_contact':r(.05,.25,2),'swing_length':r(6.5,7.8),'swings_competitive':400} for b in bats])
sprint=csv([{'player_id':b['player']['id'],'sprint_speed':r(24,30),'bolts':random.randint(0,20)} for b in bats])
oaa=csv([{'player_id':b['player']['id'],'outs_above_average':random.randint(-8,12),'fielding_runs_prevented':random.randint(-6,9),'primary_pos_formatted':'SS','display_team_name':f'Team{TEAMS[i%30]}'} for i,b in enumerate(bats[:120])])
speeds=csv([{'pitcher':p['player']['id'],'ff_avg_speed':r(90,98),'si_avg_speed':'','fc_avg_speed':'','sl_avg_speed':r(82,88),'ch_avg_speed':r(80,88)} for p in pits])
def bbrows(ps): 
    rows=[]
    for p in ps:
        v=[random.random() for _ in range(6)];s=sum(v);v=[x/s*.9 for x in v]
        rows.append({'id':p['player']['id'],'name':'x','bbe':random.randint(80,400),'gb_rate':.45,'air_rate':.45,'pull_gb_rate':v[0],'straight_gb_rate':v[1],'oppo_gb_rate':v[2],'pull_air_rate':v[3],'straight_air_rate':v[4],'oppo_air_rate':v[5]})
    return csv(rows)
PT=['FF','SL','CH','SI','CU']
def pitchcsv(hr=False,n=500):
    rows=[]
    for i in range(n):
        inplay=hr or random.random()<.2
        ev='home_run' if hr else (random.choice(['single','double','field_out','home_run','strikeout']) if inplay else '')
        ang=random.uniform(-40,40);dist=random.uniform(200,420)
        import math
        hx=125.42+math.sin(math.radians(ang))*dist/2.5;hy=198.27-math.cos(math.radians(ang))*dist/2.5
        rows.append({'game_date':f'2025-0{random.randint(4,9)}-1{random.randint(0,9)}','pitch_type':random.choice(PT),'pitch_name':'x','release_speed':r(80,99),'release_spin_rate':random.randint(1800,2700),'pfx_x':r(-1.5,1.5,2),'pfx_z':r(-.5,1.5,2),'plate_x':r(-1.5,1.5,2),'plate_z':r(1,4,2),'sz_top':3.5,'sz_bot':1.6,'zone':random.randint(1,14),'description':'hit_into_play' if inplay else random.choice(['ball','called_strike','swinging_strike','foul']),'events':ev,'type':'X' if inplay else random.choice(['B','S']),'bb_type':'fly_ball','launch_speed':r(70,112) if inplay else '','launch_angle':r(-10,45) if inplay else '','hit_distance_sc':int(dist) if inplay else '','hc_x':hx if inplay else '','hc_y':hy if inplay else '','stand':random.choice('LR'),'p_throws':'R','balls':random.randint(0,3),'strikes':random.randint(0,2),'estimated_woba_using_speedangle':r(0,1.8,3) if inplay else '','estimated_ba_using_speedangle':'.3','woba_value':r(0,2,2) if inplay else '','woba_denom':1 if inplay else '','launch_speed_angle':random.randint(1,6) if inplay else '','player_name':'Hit, Some','des':'x','home_team':'NYY','away_team':'BOS','inning_topbot':random.choice(['Top','Bot']),'inning':3,'bat_speed':r(65,78),'swing_length':7,'pitcher':2000,'batter':1000,'game_pk':1,'release_extension':6.3,'release_pos_x':-1,'release_pos_z':5.5,'on_1b':'','on_2b':'','on_3b':'','outs_when_up':1})
    return csv(rows)
def J(o): return 200,'application/json',json.dumps(o)
def handle(route):
    u=route.request.url
    if u.startswith('file:'): return route.continue_()
    def ful(t):
        route.fulfill(status=t[0],content_type=t[1],body=t[2],headers={'access-control-allow-origin':'*'})
    if 'statsapi.mlb.com' in u:
        if '/teams/stats' in u:
            g='hitting' if 'hitting' in u else 'pitching'; return ful(J({'stats':[{'splits':[tstat(t,g) for t in TEAMS]}]}))
        if '/teams?' in u: return ful(J({'teams':teams}))
        if '/standings' in u: return ful(J(standings))
        m=re.search(r'/people/(\d+)/stats',u)
        if m:
            pid=int(m.group(1));grp='hitting' if 'hitting' in u else 'pitching';st=bstat() if grp=='hitting' else pstat()
            if 'yearByYear' in u: return ful(J({'stats':[{'splits':[dict(season=str(y),stat=st,team={'name':'Foo Bars'},sport={'id':1}) for y in (2023,2024,2025)]}]}))
            if 'byMonth' in u: return ful(J({'stats':[{'splits':[dict(month=mo,stat=dict(st,ops='.'+str(700+mo*10),era='3.'+str(mo)),) for mo in range(4,10)]}]}))
            if 'gameLog' in u: return ful(J({'stats':[{'splits':[dict(date=f'2025-0{4+i//30}-{1+i%28:02d}',isHome=i%2==0,isWin=i%3==0,opponent={'id':TEAMS[i%30],'name':'x'},stat=dict(atBats=4,runs=1,hits=1,doubles=0,homeRuns=0,rbi=1,baseOnBalls=0,strikeOuts=1,stolenBases=0,hitByPitch=0,sacFlies=0,totalBases=2,inningsPitched='6.0',earnedRuns=2,numberOfPitches=90)) for i in range(60)]}]}))
            if 'statSplits' in u:
                codes=re.search(r'sitCodes=([^&]+)',u).group(1).split(',')
                return ful(J({'stats':[{'splits':[{'split':{'code':c},'stat':st} for c in codes]}]}))
        if re.search(r'/people/\d+',u): return ful(J({'people':[{'fullName':'Bat Player0','primaryPosition':{'name':'Shortstop'},'currentTeam':{'name':'City108 Team108'},'batSide':{'code':'R'},'pitchHand':{'code':'R'},'height':"6' 1\"",'weight':200,'mlbDebutDate':'2019-04-01'}]}))
        if '/schedule' in u:
            return ful(J({'dates':[{'games':[{'gameDate':f'2025-04-{1+i%28:02d}T20:00:00Z','officialDate':f'2025-04-{1+i%28:02d}','status':{'abstractGameState':'Final'},'teams':{'home':{'team':{'id':108,'name':'A'},'score':random.randint(0,9)},'away':{'team':{'id':109,'name':'B'},'score':random.randint(0,9)}}} for i in range(100)]}]}))
        if '/stats?' in u:
            grp='hitting' if 'group=hitting' in u else 'pitching'
            if 'sabermetrics' in u: return ful(J({'stats':[{'splits':bsab if grp=='hitting' else psab}]}))
            return ful(J({'stats':[{'splits':bats if grp=='hitting' else pits}]}))
        return ful((404,'text/plain','no'))
    if 'baseballsavant.mlb.com' in u:
        if 'statcast_search' in u: return ful((200,'text/csv',pitchcsv(hr='home%5C.%5C.run' in u or 'home\\.\\.run' in urllib.parse.unquote(u).replace('%5C','\\'),n=600)))
        if 'custom?' in u: return ful((200,'text/csv',sav_custom(bats if 'type=batter' in u else pits)))
        if 'bat-tracking' in u: return ful((200,'text/csv',tracking))
        if 'sprint_speed' in u: return ful((200,'text/csv',sprint))
        if 'outs_above' in u: return ful((200,'text/csv',oaa))
        if 'pitch-arsenals' in u: return ful((200,'text/csv',speeds))
        if 'pitch-arsenal-stats' in u: return ful((200,'text/csv','player_id,pitch_type,run_value_per_100,put_away\n2000,FF,1.2,20'))
        if 'batted-ball' in u: return ful((200,'text/csv',bbrows(bats if 'type=batter' in u else pits)))
        return ful((404,'text/plain','no'))
    route.abort()
ROUTES=sys.argv[1:] or ['/']
with sync_playwright() as p:
    b=p.chromium.launch();import os; pg=b.new_page(viewport={'width':int(os.environ.get('W',1300)),'height':900},color_scheme=os.environ.get('CS','light'))
    errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.route('**/*',handle)
    pg.goto('file://'+os.path.abspath('dist/mlb/index.html'))
    pg.wait_for_timeout(1500)
    for i,rt in enumerate(ROUTES):
        errs.clear()
        pg.evaluate(f"location.hash={json.dumps('#'+rt)}")
        pg.wait_for_timeout(2500)
        txt=pg.evaluate("document.querySelector('#view').innerText.slice(0,160).replace(/\\n/g,' | ')")
        nm=re.sub(r'\W+','_',rt)[:40]
        pg.screenshot(path=f'tests/shots/{i:02d}_{nm}.png')
        ov=pg.evaluate('document.documentElement.scrollWidth-innerWidth'); print(rt,'=>',txt[:50],'| overflow',ov);
        for e in errs[:4]: print('   ',e[:300])
    b.close()
