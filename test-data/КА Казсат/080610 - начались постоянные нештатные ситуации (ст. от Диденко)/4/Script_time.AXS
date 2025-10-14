CurrentDS 08061026-1;
Float dt,P;
Long i;
dT=0.5/3600;

P=0.0745;
print P*3600,P*1800,P*900.;
//P=0.0104629167;
T0=24.3663-2*P;
//t0_1_B=2.45416667;
t0_1_B=2.45416667;
t0_1_V=2.5219444;
//t0_1_R=2.59;
t0_1_R=2.59;


for (i=1;i<=480;i++){
t1_B[i]=t0_1_B+(i-1)*dT;
t1_V[i]=t0_1_V+(i-1)*dT;
t1_R[i]=t0_1_R+(i-1)*dT;
ph_1_B[i]=((t1_B[i]-T0)/P)-trunc((t1_B[i]-T0)/P);
ph_1_V[i]=((t1_V[i]-T0)/P)-trunc((t1_V[i]-T0)/P);
ph_1_R[i]=((t1_R[i]-T0)/P)-trunc((t1_R[i]-T0)/P);
}

phB=ph_1_B; 
B=B1;
phV=ph_1_V;
V=V1; 
phR=ph_1_R; 
R=R1;

Sort
	from DataSheet = 08061026-1
	Columns = {phB,B}
	to DataSheet =08061026-1
	StartColumn = phB
	AscendingBy = {phB};
Sort
	from DataSheet = 08061026-1
	Columns = {phV,V}
	to DataSheet = 08061026-1
	StartColumn = phV
	AscendingBy = {phV};
Sort
	from DataSheet = 08061026-1
	Columns = {phR,R}
	to DataSheet = 08061026-1
	StartColumn = phR
	AscendingBy = {phR};
phB2=phB+1;phV2=phV+1;phR2=phR+1;
B_V=B-V; V_R=V-R;



