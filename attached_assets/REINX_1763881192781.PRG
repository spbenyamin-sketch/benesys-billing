set talk window
set safe off
set conf off

SELE 5
USE COMP

CDAT=ALLT(COMP.CODE)
ANAM=ALLT(COMP.ANAME)
BNAM=ALLT(COMP.BNAME)
CNAM=ALLT(COMP.CNAME)
CADD=ALLT(COMP.ADD)
CADD1=ALLT(COMP.ADD1)
CADD2=ALLT(COMP.ADD2)
CADD3=ALLT(COMP.ADD3)
CTIN=ALLT(COMP.TIN)
CGST=ALLT(COMP.GST)
CCST=ALLT(COMP.CST)
CMESS=ALLT(COMP.MESS)
CMESS1=ALLT(COMP.MESS1)

TCOM=ALLT(COMP.FCODE)
TCOM1=ALLT(COMP.FCODE1)
TCOM2=ALLT(COMP.FCODE2)
CTHERMAL=COMP.THERMAL

****** COUNTER SELECION

COUNTER=ALLT(COMP.NAME1)
TCNO=COMP.CNO


TCRCOM=ALLT(COMP.FCCODE)
cphone1=allt(comp.phone)

IF COMP.POWER=.T.
	DO INDEXING
ENDIF 	

sele 4
USE LDATE 
TD=LDATE.DATE
PUBLIC MFDATE
MFDATE=COMP.SDATE



Sele comp
repl power with .f.
set talk off
keyb "{home}"
DEAC POPU COMP
RETU




proc conv1
para d
IF len(d)=1	
	retu '0'+d
ELSE
	retu d
ENDI
retu	


proc indexing
ON ERROR 
	wait wind "Improper Shut-down ! Recovering Databases Please Wait.....!"  nowa

********
*	mm=allt(str(month(date())))+RIGHT(allt(str(year(date()))),2)
*	mm=cdat+mm
*	mm1=allt(full(''))+cdat+"\*.*"

*	!/0k pkzip -o &mm &mm1
********
****NEW*
	MM=ALLT(FULL(''))+CDAT+"\"+ALLT(STR(DAY(DATE())))
	MM=MM+ALLT(STR(MONTH(DATE())))
	MM=MM+ALLT(SUBS(TIME(),1,2))+ALLT(SUBS(TIME(),4,2))
	MM=MM+"."+SUBS(ALLT(STR(YEAR(DATE()))),3,2)

	sele 4
	use ldate
	TD=LDATE.DATE

*	BAK="\?A"+CONV1(ALLT(STR(DAY(TD))))+CONV1(ALLT(STR(MONTH(TD))))+RIGHT(STR(YEAR(TD)),2)+".DBF"

	mm1=allt(full(''))+cdat+"\*.dbf"

*	mm1=allt(full(''))+cdat+BAK

	
	!/0k pkzip -o-S[9894102905] &mm &mm1
*	WAIT WIND MM
*	WAIT WIND MM1
*	CANC
********

*	!/0k fixdbf salmas
*	!/0k fixdbf &cdat\mainsale
*	!/0k fixdbf &cdat\sales
*	!/0k fixdbf &cdat\ldate
**	!/0k fixdbf &cdat\staff
*	!/0k fixdbf &cdat\deno
*	!/0k fixdbf &cdat\salespc

	jj=full("")+(cdat)+"\mainsale.cdx"
	jj1=full("")+(cdat)+"\sales.cdx"
	jj2=allt(full(""))+"salmas.cdx"
	!/0k del &jj
	!/0k del &jj1
	!/0k del &jj2
	wait wind "Improper Shut-down ! Recovering Databases Please Wait.....!"  nowa
SET CPDIALOG OFF 
SELE 1
USE SALMAS
index on code tag code
index on code1 tag code1
index on name tag name
index on groop tag groop
rein
*pack
USE 

sele 4
use ldate
rein
pack
TD=LDATE.DATE


sele 2
use &cdat\mainsale
*m1='MA'+CONV1(ALLT(STR(DAY(TD))))+CONV1(ALLT(STR(MONTH(TD))))+RIGHT(STR(YEAR(TD)),2)
*use &cdat\&M1 ALIAS MAINSALE
index on invno tag invno
index on date tag date
rein
*pack
USE 

sele 3
use &cdat\SALE ALIAS SALE
*M2='SA'+CONV1(ALLT(STR(DAY(TD))))+CONV1(ALLT(STR(MONTH(TD))))+RIGHT(STR(YEAR(TD)),2)
*use &cdat\&M2 ALIAS SALES
index on invno tag invno
index on date tag date
rein
*pack
USE

RETURN 

