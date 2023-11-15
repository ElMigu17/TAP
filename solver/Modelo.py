"""Nurse scheduling problem with shift requests."""
from ortools.sat.python import cp_model
from solver.Estruturas_de_Dados import disciplina, docente, array_manipulator
import math
import time

class distribuicao_graduacao:

    def __init__(self) -> None:
        self.fim_turno_manha = 11
        self.inicio_turno_noite = 17
        self.limite_inferior = 8
        self.limite_superior_padrao = 14
        self.limite_superior_reduzido = 12

        self.peso_infracao_horario = 0.5
        self.peso_desempate = 1000

        self.restricao_horario_turnos = False
        self.restricao_horario_23_18 = False  
        self.restricao_prioridade = False 
        self.fixados = []
        self.tempo_inicio = 0

        self.peso_pra_posicao = {
            1000: 4,
            500: 3,
            200: 2,
            50: 1,
            30: 0
        }

    def leitura_arquivo(self, name):
        am = array_manipulator()
        docentes = am.get_json(name)

        return docentes
        
    def hora_para_float(self, hor: str):
        split_hor = hor.split(":")

        split_hor[0] = float(split_hor[0])
        split_hor[1] = float(split_hor[1])

        split_hor[0] += split_hor[1]/100
        return split_hor[0]
    
    def principal(self):
        self.distribui_disciplinas_com_prioridade()
        self.distribui_restante()

    def matriz_de_correlacao(self) -> None:
        self.atribuicao = {}
        for doc in self.docentes:
            doc.disciplinas = []
            for comp in self.composicao_de_turma:
                self.atribuicao[(doc.pos, comp.pos)] = self.modelo.NewBoolVar('atribuicao_doc%idis%i' % (doc.pos, comp.pos)) 
    
    def fixacao_pos_opt(self):
        for fixado in self.fixados:
            self.modelo.AddExactlyOne(self.atribuicao[fixado])
    
    def cira_variaveis_de_agrupamento_de_composicoes(self):
        self.composicoes_por_disc = {}

        for comp in self.composicao_de_turma:
            cod_disc = hash(comp.string_cod_turma().split("_")[0])
            if cod_disc not in self.composicoes_por_disc:
                self.composicoes_por_disc[cod_disc] = []
            self.composicoes_por_disc[cod_disc].append(comp)

        self.atrib_grupos = {}
        for doc in self.docentes:
            for key in self.composicoes_por_disc:

                self.atrib_grupos[(doc.pos, key)] = self.modelo.NewBoolVar('atribuicao_doc%idiskey%i' % (doc.pos, key)) 
                for comp in self.composicoes_por_disc[key]:
                    self.modelo.Add(self.atrib_grupos[(doc.pos, key)] == 1).OnlyEnforceIf(self.atribuicao[(doc.pos, comp.pos)])

## Restrições

    def res_um_doc_por_dis(self):
        for comp in self.composicao_de_turma:
            self.modelo.AddExactlyOne(
                self.atribuicao[(doc.pos, comp.pos)] for doc in self.docentes)
            
    def res_limites_creditos(self):

        for doc in self.docentes:
            total = 0
            for comp in self.composicao_de_turma:
                total += self.atribuicao[(doc.pos, comp.pos)]*comp.qtd_creditos

            self.modelo.Add(total >= self.limite_inferior)
            if doc.reducao == 1:
                self.modelo.Add(total <= self.limite_superior_reduzido)
            else: 
                self.modelo.Add(total <= self.limite_superior_padrao)

    def ha_conflito_horario(self, dis1: disciplina, dis2: disciplina) -> bool:
        for aula1 in dis1.horarios:
            for aula2 in dis2.horarios:
                horarios1 = {
                    "inicio": self.hora_para_float(aula1["hora_inicio"]),
                    "fim": self.hora_para_float(aula1["hora_fim"])
                }
                horarios2 = {
                    "inicio": self.hora_para_float(aula2["hora_inicio"]),
                    "fim": self.hora_para_float(aula2["hora_fim"])
                }

                if self.nao_ha_intervalo_entre_dias(aula1, aula2, horarios1, horarios2):
                        return True

                if((dis1.pos != dis2.pos) and (aula2["dia_semana"] == aula1["dia_semana"])):
                    if (self.ha_conflito_de_horario(horarios1, horarios2) or
                        self.sao_no_turno_matutino_e_noturno(horarios1, horarios2)):
                        return True
                    
        return False
    
    def nao_ha_intervalo_entre_dias(self, aula1, aula2, horarios1, horarios2):
        if self.restricao_horario_23_18:
            if (aula1["dia_semana"] == aula2["dia_semana"]-1):
                if ((horarios1["inicio"] >= 21) and horarios2["inicio"] <= 10):
                    return  True

            elif (aula2["dia_semana"] == aula1["dia_semana"]-1):
                if ((horarios2["inicio"] >= 21) and horarios1["inicio"] <= 10):
                        return  True
        return False

    def ha_conflito_de_horario(self, horarios1, horarios2):
        return (((horarios1["inicio"] <= horarios2["inicio"]) and 
                    (horarios2["inicio"] <= horarios1["fim"])) or

                ((horarios2["inicio"] <= horarios1["inicio"]) and 
                    (horarios1["inicio"] <= horarios2["fim"])))

    def sao_no_turno_matutino_e_noturno(self, horarios1, horarios2):
        return (self.restricao_horario_turnos and
                ((horarios1["inicio"] <= self.fim_turno_manha and 
                  horarios2["inicio"] >= self.inicio_turno_noite) or 

                (horarios1["inicio"] >= self.inicio_turno_noite and 
                 horarios2["inicio"] <= self.fim_turno_manha)))


    def todos_conflitos_horario(self) -> list:
        ids_pares_proibidos = []
        comp = self.composicao_de_turma
        for i in range(len(self.composicao_de_turma)):
            for j in range(i, len(self.composicao_de_turma)):

                if self.ha_conflito_horario(comp[i], comp[j]):
                    ids_pares_proibidos.append([comp[i].pos, comp[j].pos])
        return ids_pares_proibidos

    def res_horario(self):
        ids_pares_proibidos = self.todos_conflitos_horario()

        for doc in self.docentes:
            for par in ids_pares_proibidos:
                self.modelo.Add((self.atribuicao[(doc.pos, par[0])] + self.atribuicao[(doc.pos, par[1])]) <= 1)

    def res_prioridade(self):
        cod_turma_to_disciplina = {}
        for comp in self.composicao_de_turma:
            cod_turma_to_disciplina[comp.string_cod_turma()] = comp

        for doc in self.docentes:
            for pre in doc.preferencia:
                if self.possui_prioridade(pre, doc):
                    comp = cod_turma_to_disciplina[pre]
                    self.modelo.AddExactlyOne(self.atribuicao[(doc.pos, comp.pos)])
    
    def res_tres_disciplina(self):
        for doc in self.docentes:
            docents_groups = 0
            for key in self.composicoes_por_disc:
                docents_groups += self.atrib_grupos[(doc.pos, key)]
            self.modelo.Add(docents_groups <= 3)

    def res_turno_escolhido(self):
        for doc in self.docentes:
            if doc.turno_de_preferencia == "N":
                self.aux_res_turno_escolhido(doc, self.possui_aula_no_turno_diurno)
            elif doc.turno_de_preferencia == "D":
                self.aux_res_turno_escolhido(doc, self.possui_aula_no_turno_noturno)
            
    def aux_res_turno_escolhido(self, doc, verifica_aula_turno_indesejado):
        for comp in self.composicao_de_turma:
            if verifica_aula_turno_indesejado(comp):
                self.modelo.Add(self.atribuicao[(doc.pos, comp.pos)] == 0)

    def possui_aula_no_turno_diurno(self, comp):
        for aula in comp.horarios:
            if self.hora_para_float(aula["hora_inicio"]) <= self.fim_turno_manha:
                return True
        return False

    def possui_aula_no_turno_noturno(self, comp):
        for aula in comp.horarios:
            if self.hora_para_float(aula["hora_fim"]) >= self.inicio_turno_noite:
                return True
        return False

    def possui_prioridade(self, pre, doc: docente):
        return pre in doc.disc_per_1 and not ( pre in doc.disc_per_2 and pre in doc.disc_per_3 )

###Otimização

    def insere_ordenado(self, lista: list, doc: docente, cod_turma_dis: str):
        i = 0
        while(i < len(lista) and 
            lista[i].tem_mais_preferencia_que(doc, cod_turma_dis)):
            i += 1
        
        lista.insert(i, doc)
        
    def hankeia_por_disciplina(self):
        ranking = {}
        for comp in self.composicao_de_turma:
            cod_turma_dis = comp.string_cod_turma()
            ranking[comp.pos] = []

            for doc in self.docentes:
                if cod_turma_dis in doc.preferencia:
                    self.insere_ordenado(ranking[comp.pos], doc, cod_turma_dis)
            
            if len(ranking[comp.pos]) <= 1:
                ranking.pop(comp.pos, None)
        
        return ranking    

    def opt_interesse(self):
        pref_disc = 0
        for doc in self.docentes:
            for comp in self.composicao_de_turma:
                if comp.codigo in doc.preferencia:
                    pref_disc += (self.atribuicao[(doc.pos, comp.pos)] * doc.preferencia[comp.codigo])
        return pref_disc

    def opt_horarios(self):
        aux_restricao_horario_23_18 = self.restricao_horario_23_18
        aux_restricao_horario_turnos = self.restricao_horario_turnos
        self.restricao_horario_23_18 = True
        self.restricao_horario_turnos = True

        soma_peso = 0

        ids_pares_proibidos = self.todos_conflitos_horario()
        for doc in self.docentes:
            for par in ids_pares_proibidos:
                soma_peso += -(self.atribuicao[(doc.pos, par[0])] + self.atribuicao[(doc.pos, par[1])])*1

        self.restricao_horario_23_18 = aux_restricao_horario_23_18        
        self.restricao_horario_turnos = aux_restricao_horario_turnos

        return soma_peso

    def opt_desempate(self):
        self.ranking = self.hankeia_por_disciplina()

        opt_formula = 0
        for h in self.ranking:
            h_doc_list = self.ranking[h]
            tam = len(h_doc_list)

            for i in range(len(h_doc_list)):
                opt_formula += (self.atribuicao[(h_doc_list[i].pos, h)] * (tam-i))
        return opt_formula

# Exibições

    def exibe_solucao_achada(self, solver):
        qtds_analisadas = {
            "pref" : [0,0,0,0,0],
            "pref_peso": 0,
            "primeiro_rank_att": 0,
            "creditos_por_doc": []
        }

        aux_restricao_horario_23_18 = self.restricao_horario_23_18
        aux_restricao_horario_turnos = self.restricao_horario_turnos
        self.restricao_horario_23_18 = True
        self.restricao_horario_turnos = True
        conflitos = self.todos_conflitos_horario()
        self.restricao_horario_23_18 = aux_restricao_horario_23_18
        self.restricao_horario_turnos = aux_restricao_horario_turnos


        for doc in self.docentes:
            qtds_analisadas["creditos_por_doc"].append(0)

            for comp in self.composicao_de_turma:
                self.analise_disciplina_solucao(solver, doc, comp, qtds_analisadas)

            for c in conflitos:

                if (self.composicao_de_turma[c[0]].string_cod_turma() in doc.disciplinas and
                    self.composicao_de_turma[c[1]].string_cod_turma() in doc.disciplinas):
                    doc.conflitos.append(self.composicao_de_turma[c[0]].string_cod_turma())
                    doc.conflitos.append(self.composicao_de_turma[c[1]].string_cod_turma())

        media_creditos = sum(qtds_analisadas["creditos_por_doc"])/len(self.docentes)
        variancia = sum((a-media_creditos)*(a-media_creditos) for a in qtds_analisadas["creditos_por_doc"])/(len(self.docentes)-1)
        desvio_padrao = math.sqrt(variancia)

        print('Preferencias atendidas =', sum(qtds_analisadas["pref"]))
        print('Total de pesos de preferencia atendidos =', qtds_analisadas["pref_peso"])
        print('Quantidade de primeiros lugar no ranking ganhadores =', qtds_analisadas["primeiro_rank_att"])
        print('Media de créditos: ', media_creditos)
        print('Variancia de créditos: ', variancia)
        print('Desvio padrão de créditos: ', desvio_padrao)

        total_pref = sum(qtds_analisadas["pref"])
        return {
            "3 - Média de créditos": math.trunc(media_creditos*100)/100,
            "4 - Desvio padrão": math.trunc(desvio_padrao*100)/100,
            "5 - Percentual de preferencias atendidas": str(math.trunc((total_pref/(len(self.docentes)*5))*10000)/100) + "%",
            "6 - Percentual de aulas que eram preferidas": str(math.trunc((total_pref/len(self.composicao_de_turma))*10000)/100) + "%",
            "7 - Percentual de preferencias de peso 5 atendidas": str(math.trunc((qtds_analisadas["pref"][4]/len(self.docentes))*10000)/100) + "%",
            "8 - Percentual de preferencias de peso 4 atendidas": str(math.trunc((qtds_analisadas["pref"][3]/len(self.docentes))*10000)/100) + "%",
            "9 - Percentual de preferencias de peso 3 atendidas": str(math.trunc((qtds_analisadas["pref"][2]/len(self.docentes))*10000)/100) + "%",

        } 
    
    def analise_disciplina_solucao(self, solver, doc: docente, comp: disciplina, qtds_analisadas: dict):
        if solver.Value(self.atribuicao[(doc.pos, comp.pos)]) == 1:
            if comp.string_cod_turma() in doc.preferencia:
                
                pos_pref = self.peso_pra_posicao[doc.preferencia[comp.string_cod_turma()]]
                qtds_analisadas["pref"][pos_pref] += 1

                qtds_analisadas["pref_peso"] += doc.preferencia[comp.string_cod_turma()]
            
            if comp.pos in self.ranking and doc == self.ranking[comp.pos][0]:
                qtds_analisadas["primeiro_rank_att"] += 1

            qtds_analisadas["creditos_por_doc"][-1] += comp.qtd_creditos
            doc.disciplinas.append(comp.string_cod_turma())

    def truncate(self, number, decimals=0):
        factor = 10 ** decimals
        return math.trunc(number * factor) / factor
    
    def verifica_solucao(self):
        retorno = False
        solver = cp_model.CpSolver()

        status = solver.Solve(self.modelo)

        if status == cp_model.OPTIMAL:
            print('Optimal solution:')

        elif status == cp_model.FEASIBLE:
            print('Feasible solution:')

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            retorno = self.exibe_solucao_achada(solver)

        else:
            print('No solution found !')
        print('\nStatistics')
        print('  - conflicts: %i' % solver.NumConflicts())
        print('  - branches : %i' % solver.NumBranches())
        print('  - total time: %f s' % (time.time() - self.tempo_inicio))
        return retorno
                
    def soluciona(self, composicao_de_turma, docentes):
       
        print("Resolvendo")
        am = array_manipulator()
        
        self.composicao_de_turma = am.dict_to_obj(composicao_de_turma)
        self.docentes = am.dict_to_obj(docentes) 

        self.modelo = cp_model.CpModel()
        self.matriz_de_correlacao()  
        self.fixacao_pos_opt()    
        self.cira_variaveis_de_agrupamento_de_composicoes()

        self.res_turno_escolhido()
        self.res_tres_disciplina()
        self.res_limites_creditos()
        self.res_um_doc_por_dis()
        self.res_horario()
        if self.restricao_prioridade:
            self.res_prioridade()
        
        soma_opt = self.opt_interesse()
        soma_opt += (self.opt_horarios() * self.peso_infracao_horario)
        soma_opt += (self.opt_desempate() * self.peso_desempate)

        self.modelo.Maximize(soma_opt)
        return self.verifica_solucao()
    
    def valida(self, composicao_de_turma, docentes, fixos):
        self.tempo_inicio = time.time()
        self.fixados = fixos
        restircoes_confgs = [
            {"prioridade": True, "horario": True},
            {"prioridade": False, "horario": True},
            {"prioridade": False, "horario": False},
        ]
        for r in restircoes_confgs:
            self.restricao_horario_turnos = r["horario"]
            self.restricao_horario_23_18 = r["horario"]
            self.restricao_prioridade = r["prioridade"]
            resultado = self.soluciona(composicao_de_turma, docentes)
            if resultado:
                resultado["1 - Houve prioridade:"] = r["prioridade"]
                resultado["2 - Houve restrição de horario:"] = r["horario"]
                return resultado  
        return False

    def main(self, composicao_de_turma, docentes):
        self.tempo_inicio = time.time()
        restircoes_confgs = [
            {"prioridade": True, "horario": True},
            {"prioridade": False, "horario": True},
            {"prioridade": False, "horario": False},
        ]

        for r in restircoes_confgs:
            self.restricao_horario_turnos = r["horario"]
            self.restricao_horario_23_18 = r["horario"]
            self.restricao_prioridade = r["prioridade"]
            resultado = self.soluciona(composicao_de_turma, docentes)
            if resultado:

                self.soluciona_com_top_ranking_fixo(composicao_de_turma, docentes)
                
                resultado = self.soluciona(composicao_de_turma, docentes)
                resultado["1 - Houve prioridade:"] = r["prioridade"]
                resultado["2 - Houve restrição de horario:"] = r["horario"]
                return resultado      
        
        return False

    def soluciona_com_top_ranking_fixo(self, composicao_de_turma, docentes):

        lista_de_infracoes_ocorridas = []
        infracoes = self.lista_restricao_capeoes_de_ranking()
        lista_de_infracoes_ocorridas.append([])

        while infracoes not in lista_de_infracoes_ocorridas:
            lista_de_infracoes_ocorridas.append(infracoes)

            for infracao in infracoes:
                self.fixados.append(infracao)
                resultado = self.soluciona(composicao_de_turma, docentes)

                if resultado == False:
                    self.fixados.remove(infracao)
            
            infracoes = self.lista_restricao_capeoes_de_ranking()

    def acha_doc_que_leciona(self, lista_doc, disc_cod):
        i = 0
        for doc in lista_doc:
            if disc_cod in doc.disciplinas:
                return i
            i += 1            
        return -1

    def lista_restricao_capeoes_de_ranking(self):
        travas = []
        
        for rank in self.ranking:
            lista_doc = self.ranking[rank]
            disc = self.composicao_de_turma[rank]
            disc_code = disc.string_cod_turma()
            ja_esta_no_topo = (disc_code in lista_doc[0].disciplinas)
            pos_rank_doc = self.acha_doc_que_leciona(lista_doc, disc_code)

            if ( ja_esta_no_topo or
                (pos_rank_doc == -1)):
                continue
                
            pos_maior_pref = pos_rank_doc
            i = pos_rank_doc - 1
            while i >= 0:
                if lista_doc[i].preferencia[disc_code] >= lista_doc[pos_maior_pref].preferencia[disc_code]:
                    pos_maior_pref = i
                i -= 1

            if pos_maior_pref != pos_rank_doc:      
                travas.append((lista_doc[pos_maior_pref].pos, disc.pos))
        return travas
            

def main():
    dg = distribuicao_graduacao()
    composicao_de_turma = dg.leitura_arquivo("disciplina2022-2")
    docente = dg.leitura_arquivo("docente2022-2")
    dg.soluciona(composicao_de_turma, docente)

if __name__ == '__main__':
    main()
