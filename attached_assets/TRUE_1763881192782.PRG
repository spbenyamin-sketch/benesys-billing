para ffile
set proc to &ffile
store .f. to nxt,prir,to,bot,del,logi
SET CONFIRM ON 
tog = .t.
x=1
y=wcols(wontop())-7
x1 = x+11
y1 = y+7
bbr=1
save=2
ON KEY LABEL F10 DO EXIT1

on key labe ctrl+f9 do miniz with tog
on key labe ctrl+uparrow do movwind with "up"
on key labe ctrl+dnarrow do movwind with "dn"
on key labe ctrl+rightarrow do movwind with "rt"
on key labe ctrl+leftarrow do movwind with "lt"


DEFINE POPUP true FROM x,y to x1,y1 shad FONT 'Consolas',13 STYLE "B" 
DEFINE BAR 1  OF true PROMPT '\<Add'
DEFINE BAR 2  OF true PROMPT '\<Edit'
DEFINE BAR 3  OF true PROMPT '\<Top' skip for to
DEFINE BAR 4  OF true PROMPT '\<Bottom' skip for bot
DEFINE BAR 5  OF true PROMPT '\<Prior' skip for prir
DEFINE BAR 6  OF true PROMPT '\<Next'skip for nxt
DEFINE BAR 7  OF true PROMPT '\<Search'
DEFINE BAR 8  OF true PROMPT '\<Delete' skip for SUPP1=.F.
DEFINE BAR 9  OF true PROMPT '\<Order' 
DEFINE BAR 10  OF true PROMPT 'E\<xit' 
on sele popu true do procez with bar()

do while !logi
	ACTIVATE POPUP true bar bbr
endd

on key labe ctrl+uparrow 
on key labe ctrl+dnarrow 
on key labe ctrl+rightarrow 
on key labe ctrl+leftarrow 
on key labe ctrl+f9
set proc to
retu

*****************************************************************
proc procez 
	para baar
	do case
		case baar = 1
			do add
		case baar = 2
			do edit
		case baar = 3
			do top
		case baar = 4
			do bottom
		case baar = 5
			do prior
		case baar = 6
			do next
		case baar = 7
			do find
		case baar = 8
			do delete
		case baar = 9
			do ordd
		case baar = 10
			do exit
	endc
retu

proc  movwind
para xx
do case
	case xx = "up"
		x = x-1	
	case xx = "dn"
		x = x+1	
	case xx = "rt"
		y = y+1	
	case xx = "lt"
		y = y-1	
endc
move popu true to x,y
retu

proc miniz
para tog
if tog
	x1 = 1
	y1 = 8
	tog=.f.
else
	tog = .t.
	x1 = 10
	y1 = 8 
endi
size popu true to x1,y1
retu

proc add
hide popu true
bbr=1
@ 1,0 say "Add" 
do clr
do while last()#27
   do disp
   read cycle
   if save = 1 
	  IF UPPER(ffile)="PURCHASE.PRG"
		TPRNO=0
		SELECT PURCHASE
		DO WHILE FLOCK("PURCHASE")
			SELECT PURCHASE
			SET ORDER TO PURNO
			GO BOTT
			M.PURNO=PURCHASE.PURNO+1
			UNLOCK IN PURCHASE
			EXIT
		ENDD
		TPRNO=M.PURNO
      ENDIF 
	  IF UPPER(ffile)="PUR.PRG"
		TSERNO=0
		SELECT PUR
		DO WHILE FLOCK("PUR")
			SELECT PUR
			SET ORDER TO SERIAL
			GO BOTT
			M.SERIAL=PUR.SERIAL+1
			UNLOCK IN PUR
			EXIT
		ENDD
		TSERNO=M.SERIAL
      ENDIF 

      appe blan
	  if UPPER(ffile)="CBENTRY.PRG"
    	M.SL=RECNO()
      ENDIF 
      gather memvar
      FLUSH
	  IF UPPER(ffile)="PURCHASE.PRG"
		MESSAGEBOX("YOUR ENTRY NUMBER -> "+STR(TPRNO),0)
	  ENDIF 
	  IF UPPER(ffile)="PUR.PRG"
		SELECT PUR
		REPLACE STOCKQTY WITH QTY
		MESSAGEBOX("YOUR SERIAL NUMBER -> "+STR(TSERNO),0)
	  ENDIF 
	  
	  IF UPPER(ffile)="OP.PRG"
  		SELECT PUR
  		SET ORDER TO SERIAL 
  		SEEK M.SERIAL
  		IF FOUND() AND EMPTY(EXPDATE)
			DO WHILE RLOCK("PUR")
				REPLACE CODE WITH M.CODE
				REPLACE CODE1 WITH M.CODE1
				REPLACE EXPDATE WITH M.EXPDATE
				UNLOCK IN PUR
				EXIT
			ENDD
		ENDIF 
		SELECT STOCK 
	  ENDIF 
      do clr
      wait wind "Entry  Updated" nowa
   endi
endd
@ 1,0 clea to 1,5
deac popu true
on key labe f4
wait clea
retu


proc edit
@ 1,0 say "Edit" 
bbr=2
hide popu true
do disp
read cycle
if save = 1
	gather memvar
	wait wind "Entry Modified " nowa
else
	 wait wind "Entry NOT Modified ...!" nowa
endi
@ 1,0 clea to 1,5
deac popu true
on key labe f1
retu

proc next
	if !eof()
		skip 1
		if eof() 
   			wait wind "Last Record" nowa
			skip -1
			nxt = .t.
			bot = .t.
			bbr = 5
			deac popu true
		else
	   		prir =.f.
   			to =.f.
		    bbr =6
		endi
	scatter memvar
	do disp
	clea gets
	endi
retu

proc exit
logi =.t.
deac popu true
rele popu true

retu

proc prior
if !bof()
	skip -1
	if !bof()
		nxt = .f.
		bot = .f.
		bbr = 5
	else
		wait wind "First Record" nowa
		skip 1
		prir = .t.
		to = .t.
		bbr = 6
		deac popu true		
	endi
	scatter memvar
	do disp
	clea gets
endi
retu

proc top
	go top
	scatter memvar
	do disp
	clea gets
	to = .t.
	prir = .t.
	bot = .f.
	nxt = .f.
	bbr=3
	deac popu true
retu

proc bottom
	go bott
	scatter memvar
	do disp
	clea gets
	bot  = .t.
	to   = .f.
	prir = .f.
	nxt  = .t.
	bbr  =  4
	deac popu true
retu

**********
proc delete
war = 'N'
defi wind warn from 10,25 to 15,60  nofl nocl shad doub title "Warning" colo sche 10  FONT 'Consolas',13 STYLE "B"  in wind Form1
acti wind warn  

?padc("*** Caution ***",40)
@ 3,5 say "Record Will Be Deleted (Y/N):" get war pict "!" 
read
bbr=8
rele wind warn
if last()#27
	if war = 'Y'
		dele
		*pack
		rein
		do prior
	endi
endi
rele wind warn
deac popu true
retu

***********

proc find
count to s
if s=0
	wait wind "NO RECORDS FOUND....." NOWA
	RETU 
ENDI
	push key clear 
	set near on
	set exact off
	rec = recn()
	on sele popu find do deac_pop
	acti popu find rest
	set near off
	pop key 
	set orde to 
	deac popu true
retu


*******
proc deac_pop
	scatter memvar
	do disp
	clea gets
	deac popu find
retu

proc search
retu

proc ordd
show popu true 
ordn = tagc(cdx(1))+ 1
dime tagd(ordn)
for i=1 to ordn-1
	tagd(i) = tag(i)
endf
tagd(i) = "Record #"
win = wontop()
defin wind oo from x+8,y-13 to x+11,y-3 in wind (win) none colo sche 10 FONT 'Consolas',13 STYLE "B"
acti wind oo top
@ 0,0 get crntord PICTURE '@^' from tagd size 3,10 defa ordn
read
rele wind oo
if crntord = ordn
	set orde to
else
	set orde to &tagd(crntord)
endi	
retu




proc exit1
logi =.t.
bopen=.t.
deac popu true
rele popu true
retu
